BEGIN;

UPDATE public.users
SET full_name = CASE student_id
  WHEN '12345678' THEN 'Abena Owusu'
  WHEN '87654321' THEN 'Kwame Agyapong'
  WHEN '84995521' THEN 'Akua Mensima'
  WHEN '37815317' THEN 'Kofi Asare'
  WHEN '90758243' THEN 'Efua Boateng'
  WHEN '42339000' THEN 'Yaw Frimpong'
  WHEN '69805478' THEN 'Ama Nyarko'
  WHEN '53430390' THEN 'Kojo Addo'
  WHEN '42469482' THEN 'Esi Amankwah'
  WHEN '83801652' THEN 'Kwabena Osei'
END
WHERE role = 'student'
  AND student_id IN (
    '12345678',
    '87654321',
    '84995521',
    '37815317',
    '90758243',
    '42339000',
    '69805478',
    '53430390',
    '42469482',
    '83801652'
  );

COMMIT;
