export type SuccessCallback<Response> = (response: Response) => void;
export type ErrorCallback<Errors> = (error: Errors) => void;
export type SideEffects<Errors, Response> = {
  onSuccess: SuccessCallback<Response>;
  onError: ErrorCallback<Errors>;
};
