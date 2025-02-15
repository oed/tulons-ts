/* eslint-disable @typescript-eslint/unbound-method */
import { Tulons } from "../src/tulons";

import mockFetch, { MockResponseInit } from 'jest-fetch-mock'

mockFetch.enableMocks();

test("Can get DID from wallet address", async () => {
  const tulons = new Tulons('localhost', 1);
  
  // set mock for the streams expected request (request for caip10 link)
  fetchMock.mockIf(/^localhost\/api\/v0\/streams$/, (req: Request): Promise<MockResponseInit | string> => {

    return Promise.resolve({
      "body": JSON.stringify({
        "streamId":"k2t6w...",
        "state": {
          "content":"did:3:kjzl6..."
        }
      })
    });
  });
  
  const did = await tulons.getDID("0x0");
  
  expect(did).toBe("did:3:kjzl6...");
});

test("Can get Genesis Hash from DID", async () => {
  const tulons = new Tulons('localhost', 1);
  
  const hash = await tulons.getGenesisHash("did:3:kjzl6...");
  
  // "did:3:kjzl6..." encoded and hashed (intergration test)
  expect(hash).toBe("k2t6wyfsu4pfy1fbtzq5i47ryj5i8m33sj2o873nwkkjlg3ox0o0m2b4mhcsz5");
});

test("Can get Genesis Streams from DID", async () => {
  const tulons = new Tulons('localhost', 1);
  
  // set mock for the streams expected request
  fetchMock.mockIf(/^localhost\/api\/v0\/multiqueries$/, (req: Request): Promise<MockResponseInit | string> => {

    return Promise.resolve({
      "body": JSON.stringify({
        "k2t6wyfsu4pfy1fbtzq5i47ryj5i8m33sj2o873nwkkjlg3ox0o0m2b4mhcsz5": {
          "content":{
            "kz2832...": "ceramic://kz29j...",
            "k3qp34...": "ceramic://kz30x..."
          }
        }
      })
    });
  });

  const streams = await tulons.getGenesisStreams("k2t6wyfsu4pfy1fbtzq5i47ryj5i8m33sj2o873nwkkjlg3ox0o0m2b4mhcsz5");
  
  // "did:3:kjzl6..." encoded and hashed (intergration test)
  expect(streams).toStrictEqual({
    "kz2832...": "ceramic://kz29j...",
    "k3qp34...": "ceramic://kz30x..."
  });
});

test("Can get Stream from a streamId", async () => {
  const tulons = new Tulons('localhost', 1);
  
  // set mock for the streams expected request
  fetchMock.mockIf(/^localhost\/api\/v0\/multiqueries$/, (req: Request): Promise<MockResponseInit | string> => {

    return Promise.resolve({
      "body": JSON.stringify({
        "kz29j...": {
          "content": {
            "test": "value"
          }
        }
      })
    });
  });

  const content = await tulons.getStream("ceramic://kz29j...");
  
  expect(content).toStrictEqual({
    "test": "value"
  });
});

test("Can get Streams from an array of streamIds", async () => {
  const tulons = new Tulons('localhost', 1);
  
  // set mock for the streams expected request
  fetchMock.mockIf(/^localhost\/api\/v0\/multiqueries$/, (req: Request): Promise<MockResponseInit | string> => {

    return Promise.resolve({
      "body": JSON.stringify({
        "kz29j...": {
          "content": {
            "test": 1
          }
        }
      })
    });
  });

  const content = await tulons.getStreams(["ceramic://kz29j..."]);
  
  expect(content).toStrictEqual({
    "kz29j...": {
      "test": 1
    }
  });
});

test("Can get hydrated content from streams content", async () => {
  const tulons = new Tulons('localhost', 1);
  
  // set mock for the streams expected request
  fetchMock.mockIf(/^localhost\/api\/v0\/multiqueries$/, (req: Request): Promise<MockResponseInit | string> => {

    return Promise.resolve({
      "body": JSON.stringify({
        "kz29j...": {
          "content": {
            "test": 1
          }
        }
      })
    });
  });

  const content = await tulons.getHydrated({
    "example": "ceramic://kz29j..."
  });
  
  expect(content).toStrictEqual({
    "example": {
      "test": 1
    }
  });
});

test("Can get hydrated content from streams content recursively", async () => {
  const tulons = new Tulons('localhost', 1);
  
  // set mock for the streams expected request
  fetchMock.mockIf(/^localhost\/api\/v0\/multiqueries$/, (req: Request): Promise<MockResponseInit | string> => {

    return Promise.resolve({
      "body": JSON.stringify({
        "kz29j...": {
          "content": {
            "test": "ceramic://kz452..."
          }
        },
        // this would be returned in a second query to /api/v0/multiqueries
        "kz452...": {
          "content": {
            "test": 1
          }
        }
      })
    });
  });

  const content = await tulons.getHydrated({
    "example": "ceramic://kz29j..."
  }, true);
  
  expect(content).toStrictEqual({
    "example": {
      "test": {
        "test": 1
      }
    }
  });
});
