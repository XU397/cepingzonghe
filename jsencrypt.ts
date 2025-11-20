import JSEncrypt from 'jsencrypt';
const publicKey =
  'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAM5b2W+KjQrLMIJPLaINGAd7KCt5cRq5tLoioe6L3MdyUI9E9wwkZeRD92Aqp4AFR9GrUy1Yw9vuDfShaDcEjbsCAwEAAQ=='; //生成的公钥
const privateKey = '';

// 加密
const encrypt = (txt: string): string => {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey); // 设置公钥
  const result = encryptor.encrypt(txt); // 对数据进行加密
  return result || ''; // 确保返回字符串
};

// 解密
const decrypt = (txt: string): string => {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(privateKey); // 设置私钥
  const result = encryptor.decrypt(txt); // 对数据进行解密
  return result || ''; // 确保返回字符串
};

export { decrypt, encrypt };
