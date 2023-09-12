import { HfGeneration } from '../../src/huggingface/text-generation';
import { inspect } from 'util';
import { isHttpError } from '../../src/shared/http';
import { StreamToIterable } from '../../src/shared';

describe('huggingface', () => {
  it('executes a run() properly)', async () => {
    try {
      const response = await HfGeneration.run(
        {
          model: 'gpt2',
          inputs: 'Whats the best way to make a chicken pesto dish?',
          parameters: {
            temperature: 0.1,
          },
        },
        // TODO mock out the calls later. This is an "integration test" for now
        { accessToken: process.env.HF_TOKEN! },
      );
      console.log(response);
      expect(response).toBeDefined();
    } catch (e: unknown) {
      if (isHttpError(e)) {
        console.log(' We have an httperror:\n', inspect(e));
      } else {
        console.log('Error:\n', e);
      }
    }
  });
  // This might be normal, but the chunks are all uint8 arrays
  it('executes a streamBytes() properly)', async () => {
    try {
      const response = await HfGeneration.streamBytes(
        {
          model: 'google/flan-t5-xxl',
          inputs: 'Whats the best way to make a chicken pesto dish?',
          parameters: {
            temperature: 0.1,
          },
        },
        // TODO mock out the calls later. This is an "integration test" for now
        { accessToken: process.env.HF_TOKEN! },
      );
      let totalResp = '';
      for await (const chunk of StreamToIterable(response)) {
        var enc = new TextDecoder('utf-8');

        console.log(enc.decode(chunk));
        totalResp += enc.decode(chunk);
      }

      console.log(totalResp);
      expect(response).toBeDefined();
    } catch (e: unknown) {
      if (isHttpError(e)) {
        console.log(' We have an httperror:\n', inspect(e));
      } else {
        console.log('Error:\n', e);
      }
    }
  });

  it('executes a stream() properly)', async () => {
    try {
      const response = await HfGeneration.stream(
        {
          model: 'google/flan-t5-xxl',
          inputs: 'Whats the best way to make a chicken pesto dish?',
          parameters: {
            temperature: 0.1,
          },
        },
        // TODO mock out the calls later. This is an "integration test" for now
        { accessToken: process.env.HF_TOKEN! },
      );
      for await (const chunk of StreamToIterable(response)) {
        console.log(chunk);
      }
    } catch (e: unknown) {
      if (isHttpError(e)) {
        console.log(' We have an httperror:\n', inspect(e));
      } else {
        console.log('Error:\n', e);
      }
    }
  });

  it('executes a streamTokens() properly)', async () => {
    try {
      const response = await HfGeneration.streamTokens(
        {
          model: 'google/flan-t5-xxl',
          inputs: 'Whats the best way to make a chicken pesto dish?',
          parameters: {
            temperature: 0.1,
          },
        },
        // TODO mock out the calls later. This is an "integration test" for now
        { accessToken: process.env.HF_TOKEN! },
      );
      for await (const chunk of StreamToIterable(response)) {
        console.log(chunk);
      }
    } catch (e: unknown) {
      if (isHttpError(e)) {
        console.log(' We have an httperror:\n', inspect(e));
      } else {
        console.log('Error:\n', e);
      }
    }
  });
});
