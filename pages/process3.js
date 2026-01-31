
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const Document = dynamic(
    () => import('react-pdf').then(mod => {
        const pdfjs = mod.pdfjs;
        if (typeof window !== 'undefined') {
            pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        return mod.Document;
    }),
    { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const Page = dynamic(
    () => import('react-pdf').then(mod => mod.Page),
    { ssr: false }
);

export default function Process3() {
    const router = useRouter();
    const [numPages, setNumPages] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [rentalData, setRentalData] = useState(null);
    const [landlordSignature, setLandlordSignature] = useState(null);
    const [tenantSignature, setTenantSignature] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('rentalData');
        const landlordSig = localStorage.getItem('landlordSignature');
        const tenantSig = localStorage.getItem('tenantSignature');
        if (data && landlordSig && tenantSig) {
            setRentalData(JSON.parse(data));
            setLandlordSignature(landlordSig);
            setTenantSignature(tenantSig);
        } else {
            // Redirect to form if no data
            router.push('/process1');
        }

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [router]);

    useEffect(() => {
        if (rentalData && landlordSignature && tenantSignature) {
            const fillPdf = async () => {
                try {
                    const url = '/edoc/rentalRoomAgreement.pdf';
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch PDF: ${response.status}`);
                    }
                    const existingPdfBytes = await response.arrayBuffer();

                    const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

                const pages = pdfDoc.getPages();
                const firstPage = pages[0];

                const { propertyAddress, landlordName, tenantName, contractStartDate, contractEndDate, depositAmount, monthlyRent, specialConditions } = rentalData;

                // PDF coordinates based on user-provided values
                const textColor = rgb(0, 0, 0);
                const fontSize = 8;

                // 1. PARTIES section - Landlord name
                firstPage.drawText(landlordName || '', { x: 164, y: 655, size: fontSize, font: helveticaFont, color: textColor });

                // 1. PARTIES section - Tenant name
                firstPage.drawText(tenantName || '', { x: 165, y: 630, size: fontSize, font: helveticaFont, color: textColor });

                // 2. PREMISES section - Property address
                firstPage.drawText(propertyAddress || '', { x: 409, y: 582, size: fontSize, font: helveticaFont, color: textColor });

                // 3. TERM section - Contract start date
                firstPage.drawText(contractStartDate || '', { x: 319, y: 510, size: fontSize, font: helveticaFont, color: textColor });

                // 3. TERM section - Contract end date
                firstPage.drawText(contractEndDate || '', { x: 235, y: 498, size: fontSize, font: helveticaFont, color: textColor });

                // 4. RENT section - Monthly rent amount
                firstPage.drawText(monthlyRent || '', { x: 297, y: 441, size: fontSize, font: helveticaFont, color: textColor });

                // 5. SECURITY DEPOSIT section - Deposit amount
                firstPage.drawText(depositAmount || '', { x: 206, y: 361, size: fontSize, font: helveticaFont, color: textColor });

                // 6. SPECIAL PROVISIONS section
                const maxWidth = 400;
                const lineHeight = 14;
                const specialText = specialConditions || '';

                // Simple line wrapping
                const words = specialText.split(' ');
                let lines = [];
                let currentLine = '';

                for (const word of words) {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    const textWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
                    if (textWidth > maxWidth && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) lines.push(currentLine);

                // Draw each line of special provisions
                let yPos = 261;
                for (const line of lines.slice(0, 4)) { // Max 4 lines
                    firstPage.drawText(line, { x: 175, y: yPos, size: 8, font: helveticaFont, color: textColor });
                    yPos -= lineHeight;
                }

                // Landlord Signature
                const landlordSigImage = await pdfDoc.embedPng(landlordSignature);
                const landlordSigDims = landlordSigImage.scale(0.3);

                firstPage.drawImage(landlordSigImage, {
                    x: 165,
                    y: 162,
                    width: landlordSigDims.width,
                    height: landlordSigDims.height,
                });

                // Tenant Signature
                const tenantSigImage = await pdfDoc.embedPng(tenantSignature);
                const tenantSigDims = tenantSigImage.scale(0.3);

                firstPage.drawImage(tenantSigImage, {
                    x: 310,
                    y: 162,
                    width: tenantSigDims.width,
                    height: tenantSigDims.height,
                });

                    const modifiedPdfBytes = await pdfDoc.save();
                    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
                    const pdfBlobUrl = URL.createObjectURL(blob);
                    setPdfUrl(pdfBlobUrl);
                } catch (error) {
                    console.error('Error loading/processing PDF:', error);
                }
            };

            fillPdf();
        }
    }, [rentalData, landlordSignature, tenantSignature]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    const handleDownload = async () => {
        if (pdfUrl) {
            const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'rental_agreement_signed.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <>
            <Head>
                <title>Automated PDF Contract Preview</title>
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <script dangerouslySetInnerHTML={{ __html: `
                    tailwind.config = {
                        darkMode: false,
                        theme: {
                            extend: {
                                colors: {
                                    "primary": "#137fec",
                                    "background-light": "#f6f7f8",
                                    "background-dark": "#101922",
                                },
                                fontFamily: {
                                    "display": ["Inter"]
                                },
                                borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                            },
                        },
                    }
                `}} />
                <style dangerouslySetInnerHTML={{ __html: `
                    body { font-family: 'Inter', sans-serif; }
                    .material-symbols-outlined {
                        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #d1d5db;
                        border-radius: 4px;
                    }
                `}} />
            </Head>
            <body className="bg-background-light min-h-screen flex flex-col font-display transition-colors duration-300">
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-10 py-3 sticky top-0 z-50">
                    <div className="flex items-center gap-4 text-primary">
                        <div className="size-6">
                            <span className="material-symbols-outlined text-3xl">gavel</span>
                        </div>
                        <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Legal-Safe Engine</h2>
                    </div>
                    <div className="flex flex-1 justify-end gap-8">
                        <div className="flex items-center gap-9">
                            <a className="text-[#111418] text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Dashboard</a>
                            <a className="text-[#111418] text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Contracts</a>
                            <a className="text-primary text-sm font-bold leading-normal border-b-2 border-primary" href="#">Preview</a>
                            <a className="text-[#111418] text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Settings</a>
                        </div>
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuACXHWT4P4JI5p5Kd2gBR9ndGuCk-VXX5pgYR8lIjdfO1kYbFdkAd4NYzFNnYtb5zYy_TJDwvG0sOobXmamrjKn_sDc4oxHwX2QrbYWHYUJ_feR19rydMrC8NirpNIMH8bbkHrO36oNOZOwki-NnZeP86rwmmZbFTS9Ou3AFpqL8W7R1Elcvy_-43i42w6U-qFe9ZrJZ9UHJsIpMDNP_0B3zW_L2oMC9X4KlQVGuviz_e0AuQWSf_HGHLxoKC9wjugbzKyJ0hOAc7Q")'}}></div>
                    </div>
                </header>
                <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-6 lg:px-10 py-6 gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <a className="text-gray-500 text-sm font-medium hover:text-primary" href="#">Home</a>
                            <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                            <a className="text-gray-500 text-sm font-medium hover:text-primary" href="#">Rent Contracts</a>
                            <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                            <span className="text-[#111418] text-sm font-semibold">Preview &amp; Review</span>
                        </div>
                        <div className="flex flex-wrap justify-between items-end gap-4">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[#111418] text-3xl font-black leading-tight tracking-tight">Review Your Contract</h1>
                                <p className="text-gray-500 text-base font-normal">Generated document for {rentalData?.propertyAddress}.</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Signed & Finalized
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-[800px]">
                            <div className="flex-1 bg-gray-100 p-8 overflow-y-auto custom-scrollbar flex flex-col items-center gap-8">
                                {pdfUrl && (
                                    <Document
                                        file={pdfUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={(error) => console.error('PDF Load Error:', error)}
                                        options={{
                                            cMapUrl: `//unpkg.com/pdfjs-dist@4.8.69/cmaps/`,
                                            cMapPacked: true,
                                        }}
                                    >
                                        {Array.from(new Array(numPages), (el, index) => (
                                            <Page
                                                key={`page_${index + 1}`}
                                                pageNumber={index + 1}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        ))}
                                    </Document>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-lg font-bold text-[#111418]">Final Steps</h3>
                                    <p className="text-sm text-gray-500">Please review the final document. Once you are satisfied, you can download the signed PDF.</p>
                                </div>
                                <button onClick={handleDownload} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]">
                                    <span className="material-symbols-outlined">download</span>
                                    Download Signed PDF
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => router.push('/process1')} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-[#111418] text-sm font-bold rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit
                                    </button>
                                    <button onClick={() => router.push('/process2')} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-[#111418] text-sm font-bold rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-sm">draw</span>
                                        Re-Sign
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </body>
        </>
    );
}
