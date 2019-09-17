insert into aladdin_follows (user_id,	profile_name,	date_followed,	unfollowed) 
values($1, $2, $3, false)
returning *