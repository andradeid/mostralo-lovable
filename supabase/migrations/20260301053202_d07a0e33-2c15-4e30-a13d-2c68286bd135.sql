-- Corrigir conversa com nome do bot "Você" para o nome real do contato
UPDATE whatsapp_conversations 
SET contact_name = 'Andrade', 
    profile_picture_url = 'https://pps.whatsapp.net/v/t61.24694-24/466883510_1272463963889582_1328902883468032058_n.jpg?ccb=11-4&oh=01_Q5Aa3gEP1E2Wow8xhy-X7nFHOLNPvLqV-qmAHeDQSbVHkTkDwA&oe=698CD1AB&_nc_sid=5e03e0&_nc_cat=105'
WHERE id = '8b8664d0-2ecb-4aea-ab40-4fcefe3530fc';