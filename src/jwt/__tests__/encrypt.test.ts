import EncryptJWT from 'jose/jwt/encrypt';
import jwtDecrypt from 'jose/jwt/decrypt';
import SignJWT from 'jose/jwt/sign';
import jwtVerify from 'jose/jwt/verify';

import { createReadStream } from 'fs';
import { readBuffer } from '../../parseBody';
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';
import { resolve as resolvePath } from 'path';

const loadPrivateKey = new Promise<KeyObject>((resolve) => {
  readBuffer(createReadStream(resolvePath(__dirname, './key.pem'))).then((buffer) => {
    resolve(createPrivateKey({ key: buffer, format: 'pem' }));
  });
});

const loadPublicKey = new Promise<KeyObject>((resolve) => {
  readBuffer(createReadStream(resolvePath(__dirname, './key.pem.pub'))).then((buffer) => {
    resolve(createPublicKey(buffer));
  });
});
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
