/*
  # Delete incomplete leads with minimal details

  Removes 12 test/incomplete leads that have very limited lead details.
  These leads (Raj, Geetha, Neelam, Joseph, Imran, Keshav, Pavan, Nikhil, Suman, Vinod, Rahul, Kavitha Prasanna)
  were created on 06-07 Jan and contain minimal information.
*/

DELETE FROM leads 
WHERE id IN (
  'db89be42-ffab-45fb-b386-0fbe024bf92e', -- Geetha
  'bc3be9d6-5269-4b13-85c2-338a37839320', -- Imran
  '7a465815-aa43-4a3c-9573-bd37c45ffc43', -- Joseph
  'd45f9f06-773a-4887-91d8-cf0497f184c3', -- Kavitha Prasanna
  '28a09b83-7906-49d0-8e02-44dffcfd083b', -- Keshav
  'e1a5569e-6bbb-423e-9a7e-5518c89db682', -- Neelam
  '87f25aea-a383-4f9c-9e1d-ac6d5d54fa50', -- Nikhil
  '610dffd1-ac87-4ea8-810c-baac956a4dcd', -- Pavan
  'e14077b6-7fcb-4b8e-bc40-3ec5d3708c29', -- Rahul
  '9b5174ec-3ad9-47aa-a5a4-ed2516f2cf9e', -- Raj
  'd7d21770-d2f2-4e8a-8c24-a04fcb7974f5', -- Suman
  '206ac7fe-d51a-44a5-bc58-fdb5d2c2102f'  -- Vinod
);
