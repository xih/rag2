// 1. install shadcn
// 2. install form and collapsible component, textarea
// 3. make a form with paperurl, name, and pages to delete
// 4. make  a util fucntion called processPagesToDelete that takes a string and converts it to an array of numbers
// 5. store the state locally in submittedData with useState

// 20. add a second form for question and answering
// 21. add a check in the backend that will verify that our database does not include a paper with this URL
// 22. if it does return it right away, so we don't have to be embedding and taking notes on multiple papers
// 23. set up a form for question answering
// 24. add a component for actually logging questions and answers, and follow up questions
// 25. add a button to easily click on a followup question and have that be sent to our API

// 26. add a new form to the second side of the page
// 27. delete the fields we don't need
// 28. copy the formSchema
// 29. connect the form schema with our API
// 30. server API requires QA since we require paperURL as well for our server endpoint

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { ArxivPaperNote } from "./api/take_notes";
import { QAResponse } from "./api/qa";

const submitPaperFormSchema = z.object({
  paperUrl: z.string().min(1),
  name: z.string().min(1),
  pagesToDelete: z.string().optional(),
});

const questionFormSchema = z.object({
  question: z.string(),
});

type SubmitPaperData = {
  paperUrl: string;
  name: string;
  pagesToDelete?: number[];
};

const processPagesToDelete = (pagesToDelete: string): number[] => {
  return pagesToDelete.split(",").map(Number);
  // return pagesToDelete.split(",").map(num => parseInt(num.trim()))
};

export default function Home() {
  const [submittedPaperData, setSubmittedPaperData] = useState<
    SubmitPaperData | undefined
  >();

  const [notes, setNotes] = useState<Array<ArxivPaperNote> | undefined>();
  // const [question, setQuestion] = useState<string>();
  const [answers, setAnswers] = useState<Array<QAResponse> | undefined>();

  const submitPaperForm = useForm({
    resolver: zodResolver(submitPaperFormSchema),
    defaultValues: {
      name: "Gorilla: Large Language Model Connected with Massive APIs",
      paperUrl: "https://arxiv.org/pdf/2305.15334.pdf",
      pagesToDelete: "10, 11, 12",
    },
  });
  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
  });

  async function onPaperSubmit(values: z.infer<typeof submitPaperFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    setSubmittedPaperData({
      ...values,
      pagesToDelete: values.pagesToDelete
        ? processPagesToDelete(values.pagesToDelete)
        : undefined,
    });

    const response = await fetch("/api/take_notes", {
      method: "post",
      body: JSON.stringify(values),
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      return null;
    });

    if (response) {
      console.log(response);
      setNotes(response);
    } else {
      throw new Error("something went wrong taking notes");
    }
  }

  async function onQuestionSubmit(values: z.infer<typeof questionFormSchema>) {
    if (!submittedPaperData) {
      throw new Error("no paper submitted");
    }

    const data = {
      ...values,
      paperUrl: submittedPaperData.paperUrl,
    };

    const response = await fetch("/api/qa", {
      method: "post",
      body: JSON.stringify(data),
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      return null;
    });

    if (response) {
      console.log(response);
      setAnswers(response);
    } else {
      throw new Error("something went wrong taking notes");
    }
  }

  console.log("1. what is notes", notes);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row gap-5 mx-auto mt-8">
        {/* add paper  */}
        <div className="flex flex-col gap-2 border-[1px] border-gray-400 rounded-md p-2">
          <Form {...submitPaperForm}>
            <form
              onSubmit={submitPaperForm.handleSubmit(onPaperSubmit)}
              className="space-y-8"
            >
              <FormField
                control={submitPaperForm.control}
                name="paperUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Url</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://arxiv.org/pdf/2404.12291.pdf"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The Url to the PDF paper you want to submit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={submitPaperForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        defaultValue="Gorilla: Large Language Model Connected with Massive APIs"
                        placeholder="Augmenting emotion features in irony detection with Large language modeling"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Name of paper</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <p className="font-normal"> Delete pages?</p>
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FormField
                    control={submitPaperForm.control}
                    name="pagesToDelete"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pages to delete</FormLabel>
                        <FormControl>
                          <Input placeholder="10, 11, 12" {...field} />
                        </FormControl>
                        <FormDescription>
                          The pages to delete from the paper
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>

        {/* qa on paper */}
        <div className="flex flex-col gap-2 border-[1px] border-gray-400 rounded-md p-2">
          <Form {...submitPaperForm}>
            <form
              onSubmit={questionForm.handleSubmit(onQuestionSubmit)}
              className="space-y-8"
            >
              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input placeholder="why is the sky blue?" {...field} />
                    </FormControl>
                    <FormDescription>
                      The question to ask about the paper
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="flex flex-row gap-5 mx-auto mt-3">
        {notes && notes.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[600px]">
            <h2>Notes</h2>
            <div className="flex flex-col gap-2">
              {notes.map((note, index) => (
                <div className="flex flex-col gap-2 p-2" key={index}>
                  <p>
                    {index + 1}. {note.note}
                  </p>
                  <p className="text-sm text-gray-600">
                    [{note.pageNumbers.join(", ")}]
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {answers && answers.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[600px]">
            <h2>Answers</h2>
            <div className="flex flex-col gap-2">
              {answers.map((answer, index) => (
                <div key={index} className="flex flex-col gap-1  p-3">
                  <p className="">
                    {index + 1}. {answer.answer}
                  </p>
                  <p>follow up questions</p>
                  <div className="flex flex-col gap-2 p-2">
                    {answer.followupQuestions.map((followupQuestion, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {followupQuestion}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
