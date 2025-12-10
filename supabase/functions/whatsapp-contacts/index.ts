import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactData {
  phone_number: string;
  name?: string;
  push_name?: string;
  profile_picture_url?: string;
  is_whatsapp_valid?: boolean;
  is_business?: boolean;
  source?: string;
  source_group_id?: string;
  source_group_name?: string;
}

interface GroupData {
  group_jid: string;
  name?: string;
  description?: string;
  picture_url?: string;
  owner_phone?: string;
  participants_count?: number;
  is_admin?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, store_id, instance_name, api_url, api_key, ...params } = await req.json();

    console.log(`[whatsapp-contacts] Action: ${action}, Store: ${store_id}`);

    // Verificar se usuário é dono da loja
    if (store_id) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, owner_id')
        .eq('id', store_id)
        .single();

      if (storeError || !store || store.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Acesso negado à loja' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let result: any;

    switch (action) {
      case 'fetchContacts': {
        // Buscar contatos da Evolution API
        const response = await fetch(`${api_url}/chat/findContacts/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
          body: JSON.stringify({ where: {} }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar contatos: ${response.statusText}`);
        }

        const contacts = await response.json();
        result = { contacts, count: contacts.length };
        break;
      }

      case 'fetchGroups': {
        // Buscar grupos da Evolution API
        const response = await fetch(`${api_url}/group/fetchAllGroups/${instance_name}?getParticipants=false`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar grupos: ${response.statusText}`);
        }

        const groups = await response.json();
        result = { groups, count: Array.isArray(groups) ? groups.length : 0 };
        break;
      }

      case 'fetchGroupMembers': {
        const { group_jid } = params;
        
        const response = await fetch(`${api_url}/group/participants/${instance_name}?groupJid=${encodeURIComponent(group_jid)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar membros: ${response.statusText}`);
        }

        const members = await response.json();
        result = { members, count: Array.isArray(members?.participants) ? members.participants.length : 0 };
        break;
      }

      case 'syncContacts': {
        // Buscar contatos da Evolution API
        const response = await fetch(`${api_url}/chat/findContacts/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
          body: JSON.stringify({ where: {} }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar contatos: ${response.statusText}`);
        }

        const contacts = await response.json();
        let synced = 0;
        let errors = 0;

        for (const contact of contacts) {
          try {
            // Extrair número do phone
            const phoneNumber = contact.id?.replace('@s.whatsapp.net', '') || 
                               contact.remoteJid?.replace('@s.whatsapp.net', '');
            
            if (!phoneNumber || phoneNumber.includes('@g.us')) continue; // Ignorar grupos

            const { error } = await supabase
              .from('whatsapp_contacts')
              .upsert({
                store_id,
                phone_number: phoneNumber,
                name: contact.name || contact.pushName,
                push_name: contact.pushName,
                profile_picture_url: contact.profilePictureUrl,
                is_whatsapp_valid: true,
                source: 'sync',
                last_synced_at: new Date().toISOString(),
              }, {
                onConflict: 'store_id,phone_number',
              });

            if (error) {
              console.error(`Erro ao sincronizar contato ${phoneNumber}:`, error);
              errors++;
            } else {
              synced++;
            }
          } catch (e) {
            console.error('Erro ao processar contato:', e);
            errors++;
          }
        }

        // Atualizar última sincronização
        await supabase
          .from('whatsapp_sync_config')
          .upsert({
            store_id,
            last_sync_at: new Date().toISOString(),
            next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }, {
            onConflict: 'store_id',
          });

        result = { synced, errors, total: contacts.length };
        break;
      }

      case 'syncGroups': {
        const response = await fetch(`${api_url}/group/fetchAllGroups/${instance_name}?getParticipants=false`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar grupos: ${response.statusText}`);
        }

        const groups = await response.json();
        let synced = 0;
        let errors = 0;

        for (const group of groups) {
          try {
            const { error } = await supabase
              .from('whatsapp_groups')
              .upsert({
                store_id,
                group_jid: group.id,
                name: group.subject || group.name,
                description: group.desc || group.description,
                picture_url: group.pictureUrl,
                owner_phone: group.owner?.replace('@s.whatsapp.net', ''),
                participants_count: group.size || group.participants?.length || 0,
                is_admin: group.announce === false || group.isCommunityAnnounce === false,
                last_synced_at: new Date().toISOString(),
              }, {
                onConflict: 'store_id,group_jid',
              });

            if (error) {
              console.error(`Erro ao sincronizar grupo:`, error);
              errors++;
            } else {
              synced++;
            }
          } catch (e) {
            console.error('Erro ao processar grupo:', e);
            errors++;
          }
        }

        result = { synced, errors, total: groups.length };
        break;
      }

      case 'extractFromGroup': {
        const { group_jid, group_name, label_id } = params;

        // Buscar membros do grupo
        const response = await fetch(`${api_url}/group/participants/${instance_name}?groupJid=${encodeURIComponent(group_jid)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar membros: ${response.statusText}`);
        }

        const data = await response.json();
        const participants = data.participants || data || [];
        let extracted = 0;
        let errors = 0;

        for (const participant of participants) {
          try {
            const phoneNumber = participant.id?.replace('@s.whatsapp.net', '') ||
                               participant.participant?.replace('@s.whatsapp.net', '');
            
            if (!phoneNumber) continue;

            const { data: contact, error } = await supabase
              .from('whatsapp_contacts')
              .upsert({
                store_id,
                phone_number: phoneNumber,
                name: participant.name || participant.pushName,
                push_name: participant.pushName,
                is_whatsapp_valid: true,
                source: 'group_extract',
                source_group_id: group_jid,
                source_group_name: group_name,
                last_synced_at: new Date().toISOString(),
              }, {
                onConflict: 'store_id,phone_number',
              })
              .select('id')
              .single();

            if (error) {
              console.error(`Erro ao extrair contato ${phoneNumber}:`, error);
              errors++;
            } else {
              extracted++;

              // Atribuir etiqueta se fornecida
              if (label_id && contact?.id) {
                await supabase
                  .from('whatsapp_contact_label_assignments')
                  .upsert({
                    contact_id: contact.id,
                    label_id,
                    assigned_by: user.id,
                  }, {
                    onConflict: 'contact_id,label_id',
                  });
              }
            }
          } catch (e) {
            console.error('Erro ao processar participante:', e);
            errors++;
          }
        }

        // Marcar grupo como extraído
        await supabase
          .from('whatsapp_groups')
          .update({
            is_extracted: true,
            extracted_at: new Date().toISOString(),
          })
          .eq('store_id', store_id)
          .eq('group_jid', group_jid);

        result = { extracted, errors, total: participants.length };
        break;
      }

      case 'checkIsWhatsApp': {
        const { phone_numbers } = params;

        const response = await fetch(`${api_url}/chat/whatsappNumbers/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
          body: JSON.stringify({ numbers: phone_numbers }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao verificar números: ${response.statusText}`);
        }

        const validNumbers = await response.json();
        result = { valid: validNumbers, count: validNumbers.length };
        break;
      }

      case 'importContacts': {
        const { contacts, label_id, source = 'manual' } = params;
        let imported = 0;
        let errors = 0;

        for (const contact of contacts as ContactData[]) {
          try {
            const { data: newContact, error } = await supabase
              .from('whatsapp_contacts')
              .upsert({
                store_id,
                phone_number: contact.phone_number.replace(/\D/g, ''),
                name: contact.name,
                source,
                is_whatsapp_valid: contact.is_whatsapp_valid ?? true,
                last_synced_at: new Date().toISOString(),
              }, {
                onConflict: 'store_id,phone_number',
              })
              .select('id')
              .single();

            if (error) {
              console.error(`Erro ao importar contato:`, error);
              errors++;
            } else {
              imported++;

              if (label_id && newContact?.id) {
                await supabase
                  .from('whatsapp_contact_label_assignments')
                  .upsert({
                    contact_id: newContact.id,
                    label_id,
                    assigned_by: user.id,
                  }, {
                    onConflict: 'contact_id,label_id',
                  });
              }
            }
          } catch (e) {
            console.error('Erro ao importar:', e);
            errors++;
          }
        }

        result = { imported, errors, total: contacts.length };
        break;
      }

      case 'exportToCSV': {
        const { label_ids, source_filter, date_from, date_to } = params;

        let query = supabase
          .from('whatsapp_contacts')
          .select(`
            phone_number,
            name,
            push_name,
            source,
            source_group_name,
            is_whatsapp_valid,
            created_at,
            whatsapp_contact_label_assignments (
              whatsapp_contact_labels (name)
            )
          `)
          .eq('store_id', store_id);

        if (source_filter) {
          query = query.eq('source', source_filter);
        }

        if (date_from) {
          query = query.gte('created_at', date_from);
        }

        if (date_to) {
          query = query.lte('created_at', date_to);
        }

        const { data: contacts, error } = await query;

        if (error) throw error;

        // Filtrar por etiquetas se especificado
        let filteredContacts = contacts || [];
        if (label_ids && label_ids.length > 0) {
          filteredContacts = filteredContacts.filter(c => 
            c.whatsapp_contact_label_assignments?.some((a: any) => 
              label_ids.includes(a.whatsapp_contact_labels?.name)
            )
          );
        }

        // Formatar para CSV
        const csvData = filteredContacts.map(c => ({
          nome: c.name || '',
          telefone: c.phone_number,
          push_name: c.push_name || '',
          origem: c.source || '',
          grupo_origem: c.source_group_name || '',
          etiquetas: c.whatsapp_contact_label_assignments
            ?.map((a: any) => a.whatsapp_contact_labels?.name)
            .filter(Boolean)
            .join(';') || '',
          whatsapp_valido: c.is_whatsapp_valid ? 'Sim' : 'Não',
          data_criacao: c.created_at,
        }));

        result = { data: csvData, count: csvData.length };
        break;
      }

      case 'assignLabels': {
        const { contact_ids, label_id } = params;
        let assigned = 0;
        let errors = 0;

        for (const contact_id of contact_ids) {
          const { error } = await supabase
            .from('whatsapp_contact_label_assignments')
            .upsert({
              contact_id,
              label_id,
              assigned_by: user.id,
            }, {
              onConflict: 'contact_id,label_id',
            });

          if (error) {
            errors++;
          } else {
            assigned++;
          }
        }

        result = { assigned, errors };
        break;
      }

      case 'removeLabels': {
        const { contact_ids, label_id } = params;

        const { error, count } = await supabase
          .from('whatsapp_contact_label_assignments')
          .delete()
          .in('contact_id', contact_ids)
          .eq('label_id', label_id);

        if (error) throw error;
        result = { removed: count };
        break;
      }

      case 'getSyncConfig': {
        const { data, error } = await supabase
          .from('whatsapp_sync_config')
          .select('*')
          .eq('store_id', store_id)
          .single();

        result = { config: data || null };
        break;
      }

      case 'updateSyncConfig': {
        const { auto_sync_enabled, sync_interval_hours, sync_contacts, sync_groups } = params;

        const nextSync = auto_sync_enabled 
          ? new Date(Date.now() + (sync_interval_hours || 24) * 60 * 60 * 1000).toISOString()
          : null;

        const { data, error } = await supabase
          .from('whatsapp_sync_config')
          .upsert({
            store_id,
            auto_sync_enabled,
            sync_interval_hours,
            sync_contacts,
            sync_groups,
            next_sync_at: nextSync,
          }, {
            onConflict: 'store_id',
          })
          .select()
          .single();

        if (error) throw error;
        result = { config: data };
        break;
      }

      case 'linkToCustomer': {
        const { contact_id, customer_id } = params;

        const { data, error } = await supabase
          .from('whatsapp_contacts')
          .update({ customer_id })
          .eq('id', contact_id)
          .eq('store_id', store_id)
          .select()
          .single();

        if (error) throw error;
        result = { contact: data };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[whatsapp-contacts] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
