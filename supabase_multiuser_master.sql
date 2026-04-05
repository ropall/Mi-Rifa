-- ============================================
-- SCRIPT MAESTRO: PLATAFORMA DE RIFAS MULTI-USUARIO
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- 1. LIMPIEZA (Opcional: puedes borrar las tablas anteriores si quieres empezar de cero)
-- DROP TABLE IF EXISTS public.tickets;
-- DROP TABLE IF EXISTS public.raffle_settings;

-- 2. TABLA DE RIFAS (Sustituye a raffle_settings y añade propiedad)
CREATE TABLE IF NOT EXISTS public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  prize text NOT NULL,
  description text,
  lottery text,
  draw_date text,
  ticket_count int4 DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- 3. TABLA DE TICKETS (Refactorizada para multi-rifa)
CREATE TABLE IF NOT EXISTS public.tickets (
  id int8 NOT NULL, -- Número del ticket (ej: 0-99)
  raffle_id uuid REFERENCES public.raffles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'paid')),
  name text,
  phone text,
  address text,
  reserved_at timestamptz,
  PRIMARY KEY (id, raffle_id) -- Clave primaria compuesta
);

-- 4. SEGURIDAD (RLS)
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Políticas para RIFAS
CREATE POLICY "Cualquiera puede ver rifas públicas" ON public.raffles
  FOR SELECT USING (true);

CREATE POLICY "Los creadores pueden insertar sus propias rifas" ON public.raffles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Los creadores pueden editar sus propias rifas" ON public.raffles
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Los creadores pueden borrar sus propias rifas" ON public.raffles
  FOR DELETE USING (auth.uid() = creator_id);

-- Políticas para TICKETS
CREATE POLICY "Cualquiera puede ver tickets de una rifa" ON public.tickets
  FOR SELECT USING (true);

CREATE POLICY "Cualquiera puede reservar un ticket disponible" ON public.tickets
  FOR UPDATE USING (status = 'available')
  WITH CHECK (status = 'reserved');

CREATE POLICY "Los dueños de la rifa tienen control total de sus tickets" ON public.tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.raffles 
      WHERE id = public.tickets.raffle_id AND creator_id = auth.uid()
    )
  );

-- 5. REALTIME
ALTER TABLE public.raffles REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;

-- 6. FUNCIÓN PARA AUTO-GENERAR TICKETS AL CREAR RIFA 
-- (Esto hace que al crear una rifa, se inserten automáticamente los 100 números)
CREATE OR REPLACE FUNCTION public.generate_tickets_for_raffle()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tickets (id, raffle_id, status)
  SELECT generate_series(0, NEW.ticket_count - 1), NEW.id, 'available';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_tickets
AFTER INSERT ON public.raffles
FOR EACH ROW EXECUTE FUNCTION public.generate_tickets_for_raffle();
