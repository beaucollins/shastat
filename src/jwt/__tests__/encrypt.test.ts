import { createPrivateKey, createPublicKey } from 'crypto';
import { createReadStream } from 'fs';
import jwtDecrypt from 'jose/jwt/decrypt';
import EncryptJWT from 'jose/jwt/encrypt';
import SignJWT from 'jose/jwt/sign';
import jwtVerify from 'jose/jwt/verify';
import { resolve as resolvePath } from 'path';

import { readBuffer } from '../../parseBody';

const readBufferFrom = (fileName: string) => readBuffer(createReadStream(resolvePath(__dirname, fileName)));

const loadPrivateKey = readBufferFrom('./key.pem').then((buffer) => createPrivateKey({ key: buffer, format: 'pem' }));

const loadPublicKey = readBufferFrom('./key.pem.pub').then(createPublicKey);

describe('encrypt', () => {
  it('works', async () => {
    const encrypted = new EncryptJWT({ hello: 'world' })
      .setProtectedHeader({ alg: 'RSA-OAEP', enc: 'A256GCM' })
      .setIssuedAt()
      .setIssuer('urn:pub.collins.shastat:issuer')
      .encrypt(await loadPrivateKey);

    await expect(encrypted).resolves.toEqual(expect.any(String));

    const token = await jwtDecrypt(await encrypted, await loadPrivateKey, {
      issuer: 'urn:pub.collins.shastat:issuer',
    });

    expect(token.payload).toMatchObject({ hello: 'world' });
  });

  it('verify', async () => {
    const signed = new SignJWT({ 'urn:example:claim': true })
      .setProtectedHeader({ alg: 'RS256' })
      .setExpirationTime('5 minutes')
      .sign(await loadPrivateKey);

    const verified = jwtVerify(await signed, await loadPublicKey);
    expect((await verified).payload).toMatchObject({
      'urn:example:claim': true,
    });
  });
});
