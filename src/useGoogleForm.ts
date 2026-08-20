import { useCallback, useState } from "react";
import {
  submitGoogleForm,
  type GoogleFieldMap,
  type GoogleFormSubmissionResult,
  type GoogleFormValues,
} from "./submitGoogleForm";

export type UseGoogleFormOptions = {
  formUrl: string;
  fieldMap?: GoogleFieldMap;
  timeout?: number;
  onSuccess?: (
    result: GoogleFormSubmissionResult,
    values: GoogleFormValues,
  ) => void;
  onError?: (error: unknown, values: GoogleFormValues) => void;
};

export type UseGoogleFormResult = {
  submit: (values: GoogleFormValues) => Promise<GoogleFormSubmissionResult>;
  reset: () => void;
  status: "idle" | "submitting" | "success" | "error";
  error: unknown;
  isSubmitting: boolean;
  isSuccess: boolean;
};

export function useGoogleForm({
  formUrl,
  fieldMap,
  timeout,
  onSuccess,
  onError,
}: UseGoogleFormOptions): UseGoogleFormResult {
  const [status, setStatus] = useState<UseGoogleFormResult["status"]>("idle");
  const [error, setError] = useState<unknown>(null);

  const submit = useCallback(
    async (values: GoogleFormValues): Promise<GoogleFormSubmissionResult> => {
      setStatus("submitting");
      setError(null);

      let result: GoogleFormSubmissionResult;
      try {
        result = await submitGoogleForm({ formUrl, fieldMap, values, timeout });
      } catch (submissionError) {
        setError(submissionError);
        setStatus("error");
        onError?.(submissionError, values);
        throw submissionError;
      }

      setStatus("success");
      onSuccess?.(result, values);
      return result;
    },
    [fieldMap, formUrl, onError, onSuccess, timeout],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    submit,
    reset,
    status,
    error,
    isSubmitting: status === "submitting",
    isSuccess: status === "success",
  };
}
