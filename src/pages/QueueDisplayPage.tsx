import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PremiumReceptionDisplay from '@/components/PremiumReceptionDisplay';

const QueueDisplayPage = () => {
  const [searchParams] = useSearchParams();
  const enableAudio = searchParams.get('audio') !== 'false';
  
  // Always show Reception queue only with premium design for waiting areas/TV displays
  return <PremiumReceptionDisplay enableAudio={enableAudio} />;
};

export default QueueDisplayPage;