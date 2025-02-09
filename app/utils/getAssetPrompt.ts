export const getAssetPrompt = (prompt: string): string => {
  return `ROLE: You are an assistant who generates social media content.
------
OBJECTIVE: The user gave you a prompt. Create an X, LinkedIn, and newsletter post based on the content of the prompt.
------
USER QUERY:\n\n ${prompt}
`;
};
