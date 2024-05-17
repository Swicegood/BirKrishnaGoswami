import React from 'react';
import { functions } from './api/firebase';
import { httpsCallable } from 'firebase/functions';
import { Text } from '../components/Themed';
import { TouchableOpacity } from 'react-native';

interface SubscribeToPubSubRequest {
    dummy: string;
  }
  
  interface subscribeToPubSubResponse {

  }
  
  interface FirebaseFunctionError {
    code: string;
    message: string;
    details?: any; // The details can vary depending on the error
  }

const TestButton = () => {
  const handleClick = async () => {
    const subscribeToPubSub = httpsCallable<SubscribeToPubSubRequest, subscribeToPubSubResponse>(functions, 'subscribeToPubSub');
    const request: SubscribeToPubSubRequest = { dummy: ''}; 

    subscribeToPubSub(request)
      .then((result: { data: subscribeToPubSubResponse }) => {
        // Use the interface for the response
        const response: subscribeToPubSubResponse = result;
        console.log("PubSubResponse", response);
      })
      .catch((error: FirebaseFunctionError) => {
        console.error("Error calling the function: ", error.message);
      });
  };

  return (
    <TouchableOpacity onPress={handleClick}>
      <Text>Test Function</Text>
    </TouchableOpacity>
  );
};

export default TestButton;