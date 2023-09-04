import { HfGeneration } from '../../src/huggingface/text-generation';

describe('run', () => {
  it('executes a generation', async () => {
    try {
      const response = await HfGeneration.run(
        {
          model: 'google/flan-t5-xxl',
          stream: true,
          inputs: 'Whats the best way to make a chicken pesto dish?',
          parameters: {
            temperature: 0,
          },
        },
        // TODO mock out the calls later. This is an "integration test" for now
        { accessToken: process.env.HF_TOKEN! }
      );

      console.log('response from HF:\n', response);
    } catch (e) {
      console.log('error', e);
    }
  });
});
