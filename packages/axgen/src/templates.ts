export const QUESTION_WITH_CONTEXT = `Context information is below.
---------------------
{context}
---------------------
Given the context information and not prior knowledge, answer the question: {query}
`;

export const QUESTION_WITHOUT_CONTEXT = 'Question: {query}\nAnswer: ';

/**
 * Anthropic
 */
export const ANTHROPIC_QUESTION_WITH_CONTEXT = `

Human: Context information is below.
---------------------
{context}
---------------------
Given the context information and not prior knowledge, answer the question: {query}

Assistant:`;

export const ANTHROPIC_QUESTION_WITHOUT_CONTEXT = '\n\nHuman: {query}\n\nAssistant:';
