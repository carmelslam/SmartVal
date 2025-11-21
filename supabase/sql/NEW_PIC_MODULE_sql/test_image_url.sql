-- Check the most recent uploaded image
SELECT
  i.id,
  i.filename,
  i.original_url,
  i.transformed_url,
  d.bucket_name,
  d.storage_path,
  d.filename as doc_filename
FROM images i
JOIN documents d ON i.document_id = d.id
ORDER BY i.created_at DESC
LIMIT 1;
