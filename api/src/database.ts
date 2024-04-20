// 0. go to supabase and create a new project
// 1. create a new function
// 1. make a new class SupabaseDatabase
// 2. supabase has two properties, vectorStore and client
// 3. generate a new instance of the class with fromDocuments which takes an array of documents
// 4. returns an instance of the class
// 5. create a method AddPaper - this adds it to the database by creating our client, finding the table, then running
// 6. INSERT into it
// 7. how do we test it?
// 8. test by going to our notes index.ts and creating a database client and inserting notes to it and seeing if it returns correctly

import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Database } from "generated/db.js";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { ArxivPaperNote } from "notes/prompts.js";

// have an array of documents that take in our array of databases and return an instance of our class

export const ARXIV_EMBEDDINGS_TABLE = "arxiv_embeddings";
export const ARXIV_PAPERS_TABLE = "arxiv_papers";
export const ARXIV_QUESTION_ANSWERING = "arxiv_question_answering";

export class SupabaseDatabase {
  // takes in our array of documents nad
  // save this to supabase

  vectorStore: SupabaseVectorStore;
  client: SupabaseClient<Database, "public", any>;

  constructor(
    client: SupabaseClient<Database, "public", any>,
    vectorStore: SupabaseVectorStore
  ) {
    this.client = client;
    this.vectorStore = vectorStore;
  }

  static async fromExistingIndex() {
    // create a new Supabase instance, but since we have existing indexes already
    // we can create it from scratch

    const privateKey = process.env.SUPABASE_PRIVATE_KEY;
    const projectUrl = process.env.SUPABASE_URL;

    if (!privateKey || !projectUrl) {
      throw new Error("missing SUPABASE_PRIVATE_KEY or SUPABASE_URL");
    }

    const client = createClient<Database>(projectUrl, privateKey);

    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        client: client,
        tableName: ARXIV_EMBEDDINGS_TABLE,
        queryName: "match_documents",
      }
    );
    return new this(client, vectorStore);
  }
  static async fromDocuments(documents: Document[]) {
    // pass in an array of documents and generate embeddings from this
    // first, make sure we have the private key and supabase URL
    // 2. create the client
    // 3. create the vectorStore

    const privateKey = process.env.SUPABASE_PRIVATE_KEY;
    const projectUrl = process.env.SUPABASE_URL;

    if (!privateKey || !projectUrl) {
      throw new Error("missing SUPABASE_PRIVATE_KEY or SUPABASE_URL");
    }

    const client = createClient<Database>(projectUrl, privateKey);

    const vectorStore = await SupabaseVectorStore.fromDocuments(
      documents,
      new OpenAIEmbeddings(),
      {
        client: client,
        tableName: ARXIV_EMBEDDINGS_TABLE,
        queryName: "match_documents",
      }
    );
    return new this(client, vectorStore);
  }

  // this method takes in
  // paperURL, name, paper, notes
  // adds it to the database?
  //
  async addPaper({
    paperUrl,
    name,
    paper,
    notes,
  }: {
    paperUrl: string;
    name: string;
    paper: string;
    notes: ArxivPaperNote[];
  }) {
    const { data, error } = await this.client
      .from(ARXIV_PAPERS_TABLE)
      .insert({
        arxiv_url: paperUrl,
        name: name,
        notes: notes,
        paper: paper,
      })
      .select();

    if (error) {
      throw new Error(`Error adding to the database ${error.message}`);
    }

    return data;
  }

  // this takes a URL and returns the paper
  async getPaper(
    url: string
  ): Promise<Database["public"]["Tables"]["arxiv_papers"]["Row"]> {
    const { data, error } = await this.client
      .from(ARXIV_PAPERS_TABLE)
      .select()
      .eq("arxiv_url", url);

    if (error || !data) {
      console.error("error getting paper from database");
      throw error;
    }

    return data[0];
  }
}
