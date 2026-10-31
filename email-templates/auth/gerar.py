"""Gera os modelos de e-mail do login do Mostralo (Supabase Auth) com a identidade da marca.
Uso: python3 gerar.py  -> cria <slug>.html e templates.json (assunto + corpo) nesta pasta.
Layout em tabelas e estilos inline (Gmail/Outlook); logo em PNG hospedado no site."""
import json, html, pathlib

ORANGE = "#D96F26"      # hsl(24 70% 50%) — laranja do Mostralo
ORANGE_DARK = "#B85A1B"
CREAM = "#FFF7F0"
INK = "#1F2937"
MUTED = "#6B7280"
LOGO = "https://mostralo.com.br/icon-192.png"
SITE = "https://mostralo.com.br"

def button(label, url):
    return f'''<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 8px">
<tr><td align="center" bgcolor="{ORANGE}" style="border-radius:10px">
<a href="{url}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Arial,Helvetica,sans-serif">{label}</a>
</td></tr></table>'''

def code_box(token):
    return f'''<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto 8px">
<tr><td align="center" style="background:{CREAM};border:1px dashed {ORANGE};border-radius:12px;padding:16px 28px;font-family:'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:{INK}">{token}</td></tr></table>'''

def fallback_link(url):
    return f'''<p style="margin:18px 0 0;font-size:12px;line-height:18px;color:{MUTED};text-align:center">Se o botão não funcionar, copie e cole este endereço no navegador:<br>
<a href="{url}" style="color:{ORANGE_DARK};word-break:break-all">{url}</a></p>'''

def layout(preheader, title, body_html, footer_note):
    return f'''<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title></head>
<body style="margin:0;padding:0;background:#F4F1EE;font-family:Arial,Helvetica,sans-serif;color:{INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{preheader}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F4F1EE">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px">
<tr><td align="center" style="padding:0 0 20px">
<a href="{SITE}" style="text-decoration:none"><img src="{LOGO}" width="48" height="48" alt="Mostralo" style="display:inline-block;vertical-align:middle;border:0;border-radius:12px">
<span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:24px;font-weight:800;color:{ORANGE};letter-spacing:-0.5px">Mostralo</span></a>
</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;border-top:5px solid {ORANGE};padding:36px 32px 32px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:{INK};text-align:center">{title}</h1>
{body_html}
</td></tr>
<tr><td align="center" style="padding:20px 8px 0;font-size:12px;line-height:18px;color:{MUTED}">
{footer_note}<br><br>
<strong style="color:{ORANGE}">Mostralo</strong> · Faz tudo para o seu negócio crescer<br>
<a href="{SITE}" style="color:{MUTED}">mostralo.com.br</a> · Este é um e-mail automático, não responda.
</td></tr>
</table></td></tr></table></body></html>'''

def p(t):
    return f'<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:{INK};text-align:center">{t}</p>'

IGNORE = "Se não foi você que pediu, pode ignorar este e-mail com segurança."
SECURITY = "Se não foi você, troque sua senha agora e fale com o suporte do Mostralo."

T = {}
T["confirmation"] = ("Confirme seu e-mail no Mostralo", layout(
    "Falta só um clique para ativar sua conta.", "Confirme seu e-mail",
    p("Que bom ter você no Mostralo! 🧡") + p("Para ativar sua conta <strong>{{ .Email }}</strong>, confirme seu e-mail no botão abaixo.")
    + button("Confirmar meu e-mail", "{{ .ConfirmationURL }}") + fallback_link("{{ .ConfirmationURL }}"), IGNORE))
T["invite"] = ("Você foi convidado para o Mostralo", layout(
    "Aceite o convite e crie sua senha.", "Você foi convidado 🎉",
    p("Você recebeu um convite para acessar o painel do Mostralo com o e-mail <strong>{{ .Email }}</strong>.") + p("Clique abaixo para aceitar e criar sua senha.")
    + button("Aceitar convite", "{{ .ConfirmationURL }}") + fallback_link("{{ .ConfirmationURL }}"), "Se você não esperava este convite, pode ignorar este e-mail."))
T["magic_link"] = ("Seu acesso ao Mostralo", layout(
    "Seu link e código de acesso.", "Seu acesso ao Mostralo",
    p("Use o botão para entrar no Mostralo:") + button("Entrar no Mostralo", "{{ .ConfirmationURL }}")
    + p('<span style="font-size:14px;color:%s">Ou digite este código:</span>' % MUTED) + code_box("{{ .Token }}")
    + fallback_link("{{ .ConfirmationURL }}"), "O link e o código valem por pouco tempo e só podem ser usados uma vez. " + IGNORE))
T["email_change"] = ("Confirme seu novo e-mail no Mostralo", layout(
    "Confirme a troca de e-mail da sua conta.", "Confirme seu novo e-mail",
    p("Recebemos o pedido para trocar o e-mail da sua conta de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>.") + p("Confirme no botão abaixo.")
    + button("Confirmar novo e-mail", "{{ .ConfirmationURL }}") + fallback_link("{{ .ConfirmationURL }}"), IGNORE))
T["recovery"] = ("Redefina sua senha do Mostralo", layout(
    "Crie uma nova senha para sua conta.", "Redefinir sua senha",
    p("Recebemos um pedido para redefinir a senha da conta <strong>{{ .Email }}</strong>.") + p("Clique abaixo para criar uma nova senha.")
    + button("Criar nova senha", "{{ .ConfirmationURL }}") + fallback_link("{{ .ConfirmationURL }}"), "O link vale por pouco tempo. " + IGNORE))
T["reauthentication"] = ("Seu código de confirmação do Mostralo", layout(
    "Use este código para confirmar a ação.", "Confirme que é você",
    p("Para concluir essa ação na sua conta, digite o código abaixo:") + code_box("{{ .Token }}"), "O código vale por pouco tempo. " + IGNORE))
# Avisos de segurança
T["password_changed_notification"] = ("Sua senha do Mostralo foi alterada", layout(
    "A senha da sua conta foi trocada.", "Sua senha foi alterada",
    p("A senha da conta <strong>{{ .Email }}</strong> foi alterada agora há pouco.") + p("Se foi você, está tudo certo e não precisa fazer nada."), SECURITY))
T["email_changed_notification"] = ("O e-mail da sua conta Mostralo foi alterado", layout(
    "O e-mail de acesso da sua conta mudou.", "Seu e-mail foi alterado",
    p("O e-mail de acesso da sua conta mudou de <strong>{{ .OldEmail }}</strong> para <strong>{{ .Email }}</strong>.") + p("Se foi você, está tudo certo."), SECURITY))
T["phone_changed_notification"] = ("O telefone da sua conta Mostralo foi alterado", layout(
    "O telefone da sua conta mudou.", "Seu telefone foi alterado",
    p("O telefone da sua conta mudou de <strong>{{ .OldPhone }}</strong> para <strong>{{ .Phone }}</strong>.") + p("Se foi você, está tudo certo."), SECURITY))
T["identity_linked_notification"] = ("Nova forma de entrar no Mostralo", layout(
    "Uma nova forma de login foi ligada à sua conta.", "Nova forma de entrar",
    p("Uma nova forma de entrar (<strong>{{ .Provider }}</strong>) foi ligada à conta <strong>{{ .Email }}</strong>.") + p("Se foi você, está tudo certo."), SECURITY))
T["identity_unlinked_notification"] = ("Uma forma de entrar foi removida da sua conta Mostralo", layout(
    "Uma forma de login foi removida da sua conta.", "Forma de entrar removida",
    p("A forma de entrar <strong>{{ .Provider }}</strong> foi removida da conta <strong>{{ .Email }}</strong>.") + p("Se foi você, está tudo certo."), SECURITY))
T["mfa_factor_enrolled_notification"] = ("Nova verificação em duas etapas no Mostralo", layout(
    "Um método de verificação foi adicionado.", "Verificação adicionada",
    p("Um novo método de verificação em duas etapas (<strong>{{ .FactorType }}</strong>) foi adicionado à conta <strong>{{ .Email }}</strong>.") + p("Se foi você, está tudo certo."), SECURITY))
T["mfa_factor_unenrolled_notification"] = ("Verificação em duas etapas removida no Mostralo", layout(
    "Um método de verificação foi removido.", "Verificação removida",
    p("Um método de verificação em duas etapas (<strong>{{ .FactorType }}</strong>) foi removido da conta <strong>{{ .Email }}</strong>.") + p("Se foi você, está tudo certo."), SECURITY))

out = pathlib.Path(__file__).parent
data = {}
for slug, (subject, body) in T.items():
    (out / f"{slug}.html").write_text(body, encoding="utf-8")
    data[slug] = {"subject": subject, "html": body}
(out / "templates.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(T), "modelos gerados")
