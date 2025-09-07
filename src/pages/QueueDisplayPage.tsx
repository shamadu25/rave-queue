import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import UniversalQueueDisplay from '@/components/UniversalQueueDisplay';
import DepartmentalQueueDisplay from '@/components/DepartmentalQueueDisplay';

const QueueDisplayPage = () => {
  const { departmentName } = useParams();
  const [searchParams] = useSearchParams();
  
  // Check if this is a universal display or departmental display
  const isUniversal = !departmentName && searchParams.get('mode') !== 'department';
  const enableAudio = searchParams.get('audio') !== 'false';
  
  // Render appropriate display based on route
  if (isUniversal) {
    return <UniversalQueueDisplay enableAudio={enableAudio} />;
  } else if (departmentName) {
    return <DepartmentalQueueDisplay department={departmentName} enableAudio={enableAudio} />;
  } else {
    // Default to universal display
    return <UniversalQueueDisplay enableAudio={enableAudio} />;
  }
};

export default QueueDisplayPage;