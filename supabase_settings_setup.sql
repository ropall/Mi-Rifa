-- 1. Crear la tabla de configuraciones de la rifa
CREATE TABLE IF NOT EXISTS public.raffle_settings (
  id int8 PRIMARY KEY DEFAULT 1,
  description text DEFAULT 'Participar es muy fácil. Selecciona uno de los 100 números disponibles en la cuadrícula, registra tus datos y nos pondremos en contacto contigo para el pago.',
  prize text DEFAULT 'Gran Sorteo Millonario',
  lottery text DEFAULT 'Lotería de Medellín',
  draw_date text DEFAULT 'Sábado 27 de Abril',
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- 2. Habilitar RLS
ALTER TABLE public.raffle_settings ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Lectura pública de configuración" ON public.raffle_settings
  FOR SELECT USING (true);

-- Política para administrador
CREATE POLICY "Gestión administrativa de configuración" ON public.raffle_settings
  FOR ALL USING (true);

-- 3. Insertar la configuración inicial
INSERT INTO public.raffle_settings (id, description, prize, lottery, draw_date)
VALUES (1, 'Participar es muy fácil. Selecciona uno de los 100 números disponibles en la cuadrícula, registra tus datos y nos pondremos en contacto contigo para el pago.', 'Gran Sorteo Millonario', 'Lotería de Medellín', 'Sábado 27 de Abril')
ON CONFLICT (id) DO NOTHING;

-- 4. Habilitar Realtime para actualizaciones automáticas
ALTER TABLE public.raffle_settings REPLICA IDENTITY FULL;
-- Recuerda activar 'public.raffle_settings' en el panel de Realtime de Supabase
