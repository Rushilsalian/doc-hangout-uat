import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useKarma } from '@/hooks/useKarma';

interface UserOffense {
  count: number;
  lastOffense: string;
  isBanned: boolean;
}

const BAD_WORDS = [
  // English
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
  // Spanish
  'mierda', 'joder', 'puta', 'cabrón', 'pendejo', 'coño',
  // French
  'merde', 'putain', 'connard', 'salope',
  // German
  'scheiße', 'arschloch', 'verdammt',
  // Italian
  'merda', 'cazzo', 'stronzo',
  // Portuguese
  'merda', 'caralho', 'porra',
  // Russian (transliterated)
  'blyad', 'suka', 'pizdec',
  // Hindi (transliterated)
  'madarchod', 'bhenchod', 'chutiya',
  // Arabic (transliterated)
  'khawal', 'sharmouta'
];

const KARMA_PENALTY = -20;
const MAX_OFFENSES = 3;

export const useModerationSystem = () => {
  
  const [userOffenses, setUserOffenses] = useState<UserOffense>(() => {
    const saved = localStorage.getItem('userOffenses');
    return saved ? JSON.parse(saved) : { count: 0, lastOffense: '', isBanned: false };
  });

  useEffect(() => {
    localStorage.setItem('userOffenses', JSON.stringify(userOffenses));
  }, [userOffenses]);

  const containsProfanity = (text: string): boolean => {
    const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, '');
    return BAD_WORDS.some(word => cleanText.includes(word));
  };

  const handleOffense = (content: string) => {
    const newCount = userOffenses.count + 1;
    
    setUserOffenses({
      count: newCount,
      lastOffense: new Date().toISOString(),
      isBanned: newCount > MAX_OFFENSES
    });


    if (newCount > MAX_OFFENSES) {
      toast({
        title: "Account Banned",
        description: "Your account has been banned for repeated violations of community guidelines.",
        variant: "destructive"
      });
    } else {
      toast({
        title: `Warning ${newCount}/${MAX_OFFENSES}`,
        description: `Inappropriate language detected. -20 Karma penalty. ${MAX_OFFENSES - newCount} warnings remaining.`,
        variant: "destructive"
      });
    }
  };

  const moderateContent = (content: string): boolean => {
    if (userOffenses.isBanned) {
      toast({
        title: "Account Banned",
        description: "You cannot post content as your account has been banned.",
        variant: "destructive"
      });
      return false;
    }

    if (containsProfanity(content)) {
      handleOffense(content);
      return false;
    }

    return true;
  };

  const resetOffenses = () => {
    setUserOffenses({ count: 0, lastOffense: '', isBanned: false });
    toast({ title: "Offenses reset", description: "Your warning count has been cleared." });
  };

  return {
    userOffenses,
    moderateContent,
    resetOffenses,
    isBanned: userOffenses.isBanned
  };
};