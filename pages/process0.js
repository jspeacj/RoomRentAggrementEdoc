
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Process0() {
    const router = useRouter();

    useEffect(() => {
        // Clear all localStorage data from process1, process2, process3
        localStorage.removeItem('rentalData');
        localStorage.removeItem('landlordSignature');
        localStorage.removeItem('tenantSignature');

        // Redirect to process1
        router.push('/process1');
    }, [router]);

    return (
        <>
            <Head>
                <title>Initializing...</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="flex justify-center items-center h-screen font-sans">
                <p className="text-gray-600">Initializing...</p>
            </div>
        </>
    );
}
