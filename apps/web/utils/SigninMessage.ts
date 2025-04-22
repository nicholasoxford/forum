import bs58 from "bs58";
import nacl from "tweetnacl";

type SignMessage = {
  domain: string;
  publicKey: string;
  nonce: string;
  statement: string;
};

export class SigninMessage {
  domain: any;
  publicKey: any;
  nonce: any;
  statement: any;

  constructor({ domain, publicKey, nonce, statement }: SignMessage) {
    this.domain = domain;
    this.publicKey = publicKey;
    this.nonce = nonce;
    this.statement = statement;
  }

  prepare() {
    return `${this.statement}${this.nonce}`;
  }

  async validate(signature: string) {
    try {
      const msg = this.prepare();
      console.log(
        "Validating signature with message:",
        msg.slice(0, 20) + "..."
      );

      if (!signature) {
        console.error("Empty signature provided");
        return false;
      }

      let signatureUint8: Uint8Array;
      try {
        signatureUint8 = bs58.decode(signature);
        console.log("Decoded signature length:", signatureUint8.length);
      } catch (decodeError) {
        console.error("Failed to decode signature:", decodeError);
        return false;
      }

      const msgUint8 = new TextEncoder().encode(msg);
      console.log("Message bytes length:", msgUint8.length);

      if (!this.publicKey) {
        console.error("No public key available for verification");
        return false;
      }

      let pubKeyUint8: Uint8Array;
      try {
        pubKeyUint8 = bs58.decode(this.publicKey);
        console.log("Decoded public key length:", pubKeyUint8.length);
      } catch (decodeError) {
        console.error("Failed to decode public key:", decodeError);
        return false;
      }

      const result = nacl.sign.detached.verify(
        msgUint8,
        signatureUint8,
        pubKeyUint8
      );
      console.log("Signature verification result:", result);
      return result;
    } catch (error) {
      console.error("Error in signature validation:", error);
      return false;
    }
  }
}
