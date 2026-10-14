UPDATE shared_qt_posts p
SET comment_count = COALESCE(c.comment_count, 0)
FROM (
  SELECT p.id, COUNT(qc.id)::integer AS comment_count
  FROM shared_qt_posts p
  LEFT JOIN qt_comments qc ON qc.post_id = p.id
  GROUP BY p.id
) c
WHERE p.id = c.id
  AND COALESCE(p.comment_count, 0) <> COALESCE(c.comment_count, 0);
