import { useState } from 'react';

const useIPFS = () => {
  const [ipfs, setIpfs] = useState(null);
  // Add IPFS logic here
  return { ipfs };
};

export default useIPFS; 