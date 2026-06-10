import { Metadata } from 'next';
import TweetFeedClient from '@/components/TweetFeedClient';

export const metadata: Metadata = {
  title: 'TweetFeed IOC | SOC-Core',
  description: 'Real-time IOC intelligence feeds from Twitter/X security researchers. Track malicious URLs, domains, IPs, and file hashes.',
};

export default function TweetFeedPage() {
  return <TweetFeedClient />;
}
