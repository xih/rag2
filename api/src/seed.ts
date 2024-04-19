// -- Enable the pgvector extension
// create extension vector;

// -- Create tables for storing Arxiv papers, embeddings, and question answering data
// CREATE TABLE arxiv_papers (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   created_at TIMESTAMPTZ DEFAULT now(),
//   paper TEXT,
//   arxiv_url TEXT,
//   notes JSONB[],
//   name TEXT
// );

// CREATE TABLE arxiv_embeddings (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   created_at TIMESTAMPTZ DEFAULT now(),
//   content TEXT,
//   embedding vector,
//   metadata JSONB
// );

// CREATE TABLE arxiv_question_answering (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   created_at TIMESTAMPTZ DEFAULT now(),
//   question TEXT,
//   answer TEXT,
//   followup_questions TEXT[],
//   context TEXT
// );

// -- Create a function for document matching
// create function match_documents (
//   query_embedding vector(1536),
//   match_count int DEFAULT null,
//   filter jsonb DEFAULT '{}'
// ) returns table (
//   id UUID,
//   content text,
//   metadata jsonb,
//   embedding vector,
//   similarity float
// )
// language plpgsql
// as $$
// #variable_conflict use_column
// begin
//   return query
//   select
//     id,
//     content,
//     metadata,
//     embedding,
//     1 - (arxiv_embeddings.embedding <=> query_embedding) as similarity
//   from arxiv_embeddings
//   where metadata @> filter
//   order by arxiv_embeddings.embedding <=> query_embedding
//   limit match_count;
// end;
// $$;
