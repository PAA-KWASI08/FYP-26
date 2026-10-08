BEGIN;

INSERT INTO public.announcements (
  title,
  message,
  type,
  audience,
  section_id,
  status,
  expires_at,
  created_by,
  created_by_prototype
)
SELECT seed.title,
       seed.message,
       seed.type,
       'all_students',
       NULL,
       'published',
       NULL,
       NULL,
       'admin001'
FROM (
  VALUES
    (
      'Check seat availability before settling',
      'Use the seat map as a guide, then confirm that your selected seat is available when you arrive.',
      'general'
    ),
    (
      'Keep study areas quiet',
      'Please keep conversations and device audio low in quiet study areas so everyone can concentrate.',
      'general'
    ),
    (
      'Keep aisles and exits clear',
      'Keep walkways, entrances, and emergency exits clear. Do not leave bags or other belongings where they obstruct access.',
      'important'
    ),
    (
      'Report damaged seats to library staff',
      'If a seat or its QR label is damaged, please notify library staff rather than moving or altering the label.',
      'maintenance'
    ),
    (
      'Look after your belongings',
      'Please keep personal belongings with you. Contact library staff if you find an unattended item.',
      'general'
    )
) AS seed(title, message, type)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.announcements AS existing
  WHERE existing.title = seed.title
    AND existing.created_by_prototype = 'admin001'
);

COMMIT;
