-- Adicionar novo valor 'aguardando_pagamento' ao enum order_status
ALTER TYPE order_status ADD VALUE 'aguardando_pagamento' BEFORE 'entrada';