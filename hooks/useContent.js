import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useContent() {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'landingPageContent', 'main');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContent(data);
        } else {
          console.log('No content document found');
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return {
    hero: content?.hero || {},
    features: content?.features || [],
    isLoading,
    error
  };
}