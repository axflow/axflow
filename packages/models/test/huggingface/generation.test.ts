import { HfGeneration } from '../../src/huggingface/text-generation';

describe('run', () => {
  it('executes a generation', async () => {
    try {
      const response = await HfGeneration.run(
        {
          model: 'gpt2',
          stream: true,
          inputs: 'The answer to the universe is',
          parameters: {
            temperature: 0,
          },
        },
        // TODO mock out the calls later. This is an "integration test" for now
        { accessToken: process.env.HF_TOKEN! },
      );

      console.log('response from HF:\n', response);
    } catch (e) {
      console.log('error', e);
    }
  });
});
