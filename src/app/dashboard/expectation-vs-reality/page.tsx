import ComparisonLayout from '@/modules/comparison/_components/ComparisonLayout';
import '@/modules/comparison/_styles/comparison.css';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'What I expected vs What I got',
};

export default async function ExpectationVsRealityPage() {
  const expectedDir = path.join(process.cwd(), 'src', 'modules', 'core', '_assets', 'expectationvsreality', 'expected');
  const realityDir = path.join(process.cwd(), 'src', 'modules', 'core', '_assets', 'expectationvsreality', 'reality');
  
  let expectedImages: string[] = [];
  let realityImages: string[] = [];

  try {
    if (fs.existsSync(expectedDir)) {
      expectedImages = fs.readdirSync(expectedDir)
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(f => `expectationvsreality/expected/${f}`);
    }
  } catch (error) {
    console.error('Error reading expected directory:', error);
  }

  try {
    if (fs.existsSync(realityDir)) {
      realityImages = fs.readdirSync(realityDir)
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(f => `expectationvsreality/reality/${f}`);
    }
  } catch (error) {
    console.error('Error reading reality directory:', error);
  }


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ComparisonLayout expectedImages={expectedImages} realityImages={realityImages} />
    </div>
  );
}
