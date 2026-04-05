-- 1. Crea la tabla de tickets con los campos necesarios
CREATE TABLE IF NOT EXISTS public.tickets (
  id int8 PRIMARY KEY, -- Número del ticket (0-99)
  status text DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'paid')),
  name text,
  phone text,
  address text,
  reserved_at timestamptz
);

-- 2. Habilita el acceso público (Lectura y Actualización) 
-- NOTA: En un entorno real, usarías RLS (Row Level Security) más estricto
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Política para que cualquiera pueda ver los tickets
CREATE POLICY "Permitir lectura pública" ON public.tickets
  FOR SELECT USING (true);

-- Política para que cualquiera pueda reservar un ticket (Actualizar de 'available' a 'reserved')
CREATE POLICY "Permitir reserva de tickets disponibles" ON public.tickets
  FOR UPDATE USING (status = 'available')
  WITH CHECK (status = 'reserved');

-- Política para el administrador (Acceso total si es necesario, o habilitar para el dashboard)
-- Por simplicidad en este ejemplo, permitimos que el dashboard actualice cualquier registro
-- En producción, esto debería estar protegido por Auth de Supabase.
CREATE POLICY "Permitir gestión administrativa" ON public.tickets
  FOR UPDATE USING (true);

-- 3. Inserta los 100 números iniciales (del 0 al 99)
INSERT INTO public.tickets (id, status)
SELECT 
  generate_series(0, 99) as id,
  'available' as status
ON CONFLICT (id) DO NOTHING;

-- 4. Habilita Realtime para esta tabla (para que los cambios se vean al instante)
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
-- Asegúrate de activar el canal 'public.tickets' en el panel de Realtime de Supabase
