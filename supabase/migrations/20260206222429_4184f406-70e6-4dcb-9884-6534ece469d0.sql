UPDATE auth.users 
SET encrypted_password = extensions.crypt('Gl83530727', extensions.gen_salt('bf')), 
    updated_at = now()
WHERE id = '9fb1bebf-5259-4284-a454-a1dafe9eb269';