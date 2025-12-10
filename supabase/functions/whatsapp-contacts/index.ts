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

// Função para criar variantes de telefone brasileiro (com/sem 55, com/sem 9° dígito)
const createPhoneVariants = (phone: string): string[] => {
  const normalized = phone.replace(/\D/g, '');
  if (!normalized) return [];
  
  const variants: string[] = [normalized];
  
  // Com/sem código do país 55
  if (normalized.startsWith('55') && normalized.length > 10) {
    variants.push(normalized.slice(2)); // Sem 55
  } else if (!normalized.startsWith('55')) {
    variants.push('55' + normalized); // Com 55
  }
  
  // Variantes de 9° dígito (para celulares brasileiros)
  const processedVariants = [...variants];
  for (const v of processedVariants) {
    const withoutCountry = v.startsWith('55') ? v.slice(2) : v;
    
    // Se tem 11 dígitos e o 3° dígito é 9 → criar versão sem o 9
    // Ex: 61994009368 (11 dig) → 6194009368 (10 dig)
    if (withoutCountry.length === 11 && withoutCountry[2] === '9') {
      const without9 = withoutCountry.slice(0, 2) + withoutCountry.slice(3);
      variants.push(without9);
      variants.push('55' + without9);
    }
    
    // Se tem 10 dígitos → criar versão com o 9 adicionado
    // Ex: 6194009368 (10 dig) → 61994009368 (11 dig)
    if (withoutCountry.length === 10) {
      const with9 = withoutCountry.slice(0, 2) + '9' + withoutCountry.slice(2);
      variants.push(with9);
      variants.push('55' + with9);
    }
  }
  
  return [...new Set(variants)]; // Remover duplicatas
};

// Função para extrair número de telefone válido de múltiplos campos possíveis
// Evolution API 2.3+ usa IDs internos, o número real está em campos alternativos
const extractPhoneNumber = (contact: any): string | null => {
  // Campos possíveis onde o número pode estar (ordem de prioridade)
  const possibleFields = [
    contact.remoteJid,
    contact.owner,
    contact.wuid,
    contact.jid,
    contact.phone,
    contact.phoneNumber,
    contact.id, // Último porque pode ser ID interno
  ];
  
  for (const field of possibleFields) {
    if (!field || typeof field !== 'string') continue;
    
    // Limpar sufixos do WhatsApp
    let cleaned = field
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace('@lid', '')
      .replace(/@.*$/, ''); // Remove qualquer sufixo @ restante
    
    // Verificar se é um número válido (apenas dígitos, 10-15 caracteres)
    if (/^\d{10,15}$/.test(cleaned)) {
      return cleaned;
    }
  }
  
  return null; // Não encontrou número válido
};

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

    const { action, store_id, instance_name, ...params } = await req.json();

    console.log(`[whatsapp-contacts] Action: ${action}, Store: ${store_id}`);

    // Buscar config da Evolution API internamente (mais seguro - não depende do frontend)
    let api_url = params.api_url;
    let api_key = params.api_key;
    
    // Se não foi passado, buscar do banco
    if (!api_url || !api_key) {
      const { data: evolutionConfig } = await supabase
        .from('evolution_config')
        .select('api_url, api_key')
        .eq('is_active', true)
        .single();

      if (evolutionConfig) {
        api_url = evolutionConfig.api_url;
        api_key = evolutionConfig.api_key;
      } else {
        console.log('[whatsapp-contacts] Evolution config not found');
      }
    }

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
        let skipped = 0;
        let linked = 0;

        // Log de debug para primeiros 3 contatos
        console.log('[whatsapp-contacts] Sample contacts structure:', JSON.stringify(contacts.slice(0, 3), null, 2));

        // === CRIAR/GARANTIR ETIQUETA "Cliente" PARA A LOJA ===
        let clienteLabelId: string | null = null;
        
        // Tentar buscar etiqueta existente
        const { data: existingLabel } = await supabase
          .from('whatsapp_contact_labels')
          .select('id')
          .eq('store_id', store_id)
          .eq('name', 'Cliente')
          .maybeSingle();

        if (existingLabel) {
          clienteLabelId = existingLabel.id;
          console.log('[whatsapp-contacts] Etiqueta "Cliente" já existe:', clienteLabelId);
        } else {
          // Criar etiqueta "Cliente"
          const { data: newLabel, error: labelError } = await supabase
            .from('whatsapp_contact_labels')
            .insert({
              store_id,
              name: 'Cliente',
              color: '#22c55e', // Verde
              description: 'Clientes cadastrados na loja'
            })
            .select('id')
            .single();

          if (labelError) {
            console.error('[whatsapp-contacts] Erro ao criar etiqueta Cliente:', labelError);
          } else {
            clienteLabelId = newLabel?.id || null;
            console.log('[whatsapp-contacts] Etiqueta "Cliente" criada:', clienteLabelId);
          }
        }

        // Buscar todos os clientes da loja para comparação rápida
        const { data: storeCustomers } = await supabase
          .from('customer_stores')
          .select('customer_id, customers!inner(id, name, phone)')
          .eq('store_id', store_id);

        // Criar mapa de telefone -> customer para busca rápida
        // Usando createPhoneVariants para lidar com 9° dígito e código do país
        const customerMap = new Map<string, { id: string; name: string }>();
        
        if (storeCustomers) {
          for (const cs of storeCustomers) {
            const customer = cs.customers as any;
            if (customer?.phone) {
              const customerData = { id: customer.id, name: customer.name };
              
              // Criar todas as variantes possíveis do telefone do cliente
              const variants = createPhoneVariants(customer.phone);
              for (const variant of variants) {
                customerMap.set(variant, customerData);
              }
            }
          }
        }
        
        console.log('[whatsapp-contacts] Customer map size:', customerMap.size, 'variants for', storeCustomers?.length || 0, 'customers');

        for (const contact of contacts) {
          try {
            // Usar função de extração validada
            const phoneNumber = extractPhoneNumber(contact);
            
            // Ignorar se não encontrou número válido ou é grupo
            if (!phoneNumber) {
              console.log('[whatsapp-contacts] Skipping contact without valid phone:', contact.id?.slice(0, 20));
              skipped++;
              continue;
            }
            
            if (contact.id?.includes('@g.us')) continue; // Ignorar grupos

            // Verificar se é um cliente da loja usando todas as variantes possíveis
            const contactVariants = createPhoneVariants(phoneNumber);
            let matchedCustomer = null;
            
            for (const variant of contactVariants) {
              matchedCustomer = customerMap.get(variant);
              if (matchedCustomer) {
                console.log(`[whatsapp-contacts] Match found: ${phoneNumber} → ${variant} → ${matchedCustomer.name}`);
                break;
              }
            }

            const contactData: any = {
              store_id,
              phone_number: phoneNumber,
              name: matchedCustomer?.name || contact.name || contact.pushName,
              push_name: contact.pushName,
              profile_picture_url: contact.profilePictureUrl,
              is_whatsapp_valid: true,
              source: 'sync',
              last_synced_at: new Date().toISOString(),
            };

            // Vincular customer_id se encontrado
            if (matchedCustomer) {
              contactData.customer_id = matchedCustomer.id;
              linked++;
            }

            const { data: upsertedContact, error } = await supabase
              .from('whatsapp_contacts')
              .upsert(contactData, {
                onConflict: 'store_id,phone_number',
              })
              .select('id')
              .single();

            if (error) {
              console.error(`Erro ao sincronizar contato ${phoneNumber}:`, error);
              errors++;
            } else {
              synced++;

              // === ATRIBUIR ETIQUETA "Cliente" SE É CLIENTE ===
              if (matchedCustomer && clienteLabelId && upsertedContact?.id) {
                const { error: labelAssignError } = await supabase
                  .from('whatsapp_contact_label_assignments')
                  .upsert({
                    contact_id: upsertedContact.id,
                    label_id: clienteLabelId,
                    assigned_by: user.id,
                  }, {
                    onConflict: 'contact_id,label_id',
                  });

                if (labelAssignError) {
                  console.error(`Erro ao atribuir etiqueta Cliente:`, labelAssignError);
                }
              }
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

        console.log(`[whatsapp-contacts] Sync complete: ${synced} synced, ${linked} linked to customers, ${skipped} skipped (invalid phone), ${errors} errors`);
        result = { synced, errors, skipped, linked, total: contacts.length };
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
        let skipped = 0;

        // Log de debug para primeiros 3 participantes
        console.log('[whatsapp-contacts] Sample participants structure:', JSON.stringify(participants.slice(0, 3), null, 2));

        for (const participant of participants) {
          try {
            // Usar função de extração validada
            const phoneNumber = extractPhoneNumber(participant);
            
            if (!phoneNumber) {
              console.log('[whatsapp-contacts] Skipping participant without valid phone:', participant.id?.slice(0, 20));
              skipped++;
              continue;
            }

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

        console.log(`[whatsapp-contacts] Extract complete: ${extracted} extracted, ${skipped} skipped (invalid phone), ${errors} errors`);
        result = { extracted, errors, skipped, total: participants.length };
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
