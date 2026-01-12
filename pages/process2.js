
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import SignatureCanvas from 'react-signature-canvas';

const Document = dynamic(() => import('react-pdf').then(mod => {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return mod.Document;
}), { ssr: false });

const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

export default function Process2() {
    const router = useRouter();
    const [numPages, setNumPages] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [rentalData, setRentalData] = useState(null);
    const [landlordSignature, setLandlordSignature] = useState(null);
    const [tenantSignature, setTenantSignature] = useState(null);
    const landlordSigCanvas = useRef({});
    const tenantSigCanvas = useRef({});

    useEffect(() => {
        const data = localStorage.getItem('rentalData');
        if (data) {
            setRentalData(JSON.parse(data));
        } else {
            // Redirect to form if no data
            router.push('/process1');
        }

        // Load existing signatures from localStorage
        const savedLandlordSig = localStorage.getItem('landlordSignature');
        const savedTenantSig = localStorage.getItem('tenantSignature');

        if (savedLandlordSig) {
            setLandlordSignature(savedLandlordSig);
            // Draw signature on canvas after component mounts
            setTimeout(() => {
                if (landlordSigCanvas.current && landlordSigCanvas.current.fromDataURL) {
                    landlordSigCanvas.current.fromDataURL(savedLandlordSig);
                }
            }, 100);
        }

        if (savedTenantSig) {
            setTenantSignature(savedTenantSig);
            // Draw signature on canvas after component mounts
            setTimeout(() => {
                if (tenantSigCanvas.current && tenantSigCanvas.current.fromDataURL) {
                    tenantSigCanvas.current.fromDataURL(savedTenantSig);
                }
            }, 100);
        }

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [router]);

    useEffect(() => {
        if (rentalData) {
            const fillPdf = async () => {
                const url = '/edoc/rentalRoomAgreement.pdf';
                const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

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

                const modifiedPdfBytes = await pdfDoc.save();
                const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
                const pdfBlobUrl = URL.createObjectURL(blob);
                setPdfUrl(pdfBlobUrl);
            };

            fillPdf();
        }
    }, [rentalData]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    const handleDownload = async () => {
        if (pdfUrl) {
            const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'rental_agreement.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleClearLandlord = () => {
        landlordSigCanvas.current.clear();
        setLandlordSignature(null);
    }

    const handleSaveLandlord = () => {
        setLandlordSignature(landlordSigCanvas.current.toDataURL());
    }

    const handleClearTenant = () => {
        tenantSigCanvas.current.clear();
        setTenantSignature(null);
    }

    const handleSaveTenant = () => {
        setTenantSignature(tenantSigCanvas.current.toDataURL());
    }

    const handleFinalize = () => {
        if (landlordSignature && tenantSignature) {
            localStorage.setItem('landlordSignature', landlordSignature);
            localStorage.setItem('tenantSignature', tenantSignature);
            router.push('/process3');
        } else {
            alert('Please provide both Landlord and Tenant signatures.');
        }
    };

    return (
        <>
            <Head>
                <title>Electronic Signature and Stamp Setup</title>
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <script dangerouslySetInnerHTML={{ __html: `
                    tailwind.config = {
                        darkMode: "class",
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
                    .material-symbols-outlined {
                        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    }
                    .pdf-page-shadow {
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    }
                `}} />
            </Head>
            <body className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white transition-colors duration-200">
                <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                    <div className="layout-container flex h-full grow flex-col">
                        {/* Top Navigation */}
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#dbe0e6] dark:border-b-[#2a343d] bg-white dark:bg-background-dark px-10 py-3 sticky top-0 z-50">
                            <div className="flex items-center gap-4 text-[#111418] dark:text-white">
                                <div className="size-8 text-primary">
                                    <span className="material-symbols-outlined text-4xl">contract_edit</span>
                                </div>
                                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">RentSigner</h2>
                            </div>
                            <div className="flex flex-1 justify-end gap-8">
                                <div className="flex items-center gap-9">
                                    <a className="text-[#111418] dark:text-white text-sm font-medium leading-normal" href="#">Dashboard</a>
                                    <a className="text-[#111418] dark:text-white text-sm font-medium leading-normal" href="#">Contracts</a>
                                    <a className="text-[#111418] dark:text-white text-sm font-medium leading-normal" href="#">Templates</a>
                                </div>
                                <button onClick={handleFinalize} className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                    <span className="truncate">Finalize and Sign</span>
                                </button>
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDrpkIe6qxWIoedGpXDDUMrg0jdseZMG__pbPjQCQj_QIyjdr3EZtsJwD2-9mGgmm3aPYMDKHpY3wNceOzyhda-Gec_TdICr6qPExPrHzE40-fXzWGyTuOot0m-Ha4AGStMYb9Y4pSW7vexDo9PUcjNdblBqk9HRW4ucfbvxur630J4DULT272wniDuM78rdvBPpEDezqOeXynO03r9ASoR-oOkCZfV41ahHivLVRR8FwyJ-ORZyIq7WLpHjFGmajDFCjldMIapRKc")'}}></div>
                            </div>
                        </header>
                        <main className="flex flex-1 flex-col">
                            {/* Breadcrumbs */}
                            <div className="px-10 lg:px-40 py-2">
                                <div className="flex flex-wrap gap-2 py-2">
                                    <a className="text-[#617589] text-sm font-medium leading-normal hover:text-primary" href="#">Drafts</a>
                                    <span className="text-[#617589] text-sm font-medium leading-normal">/</span>
                                    <a className="text-[#617589] text-sm font-medium leading-normal hover:text-primary" href="#">Contract #4402 - Residential Lease</a>
                                    <span className="text-[#617589] text-sm font-medium leading-normal">/</span>
                                    <span className="text-[#111418] dark:text-white text-sm font-medium leading-normal">Signature Setup</span>
                                </div>
                            </div>
                            {/* Page Heading */}
                            <div className="px-10 lg:px-40 pb-4">
                                <div className="flex flex-wrap justify-between items-end gap-3">
                                    <div className="flex min-w-72 flex-col gap-1">
                                        <h1 className="text-[#111418] dark:text-white tracking-tight text-3xl font-bold leading-tight">Contract Signature &amp; Stamp Setup</h1>
                                        <p className="text-[#617589] text-sm font-normal leading-normal">Draw your signature in the box below.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#dbe0e6] dark:border-[#2a343d] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <span className="material-symbols-outlined text-sm">download</span> Download Draft
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Workspace: Sidebar + PDF Viewer */}
                            <div className="flex flex-1 px-10 lg:px-40 py-6 gap-6 h-full overflow-hidden">
                                {/* Left Sidebar: Tools & Assets */}
                                <aside className="w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto">
                                    {/* Landlord Signature */}
                                    <div className="bg-white dark:bg-background-dark border border-[#dbe0e6] dark:border-[#2a343d] rounded-xl flex flex-col p-5">
                                        <div className="flex flex-col mb-4">
                                            <h3 className="text-[#111418] dark:text-white text-base font-bold">Landlord Signature</h3>
                                            <p className="text-[#617589] text-xs font-normal">Draw landlord signature below</p>
                                        </div>
                                        <div className="relative h-32 w-full border rounded-lg bg-white">
                                            <SignatureCanvas
                                                ref={landlordSigCanvas}
                                                penColor='black'
                                                canvasProps={{className: 'w-full h-full'}}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={handleClearLandlord} className="flex-1 px-3 py-1.5 rounded-lg border border-[#dbe0e6] dark:border-[#2a343d] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Clear</button>
                                            <button onClick={handleSaveLandlord} className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90">Save</button>
                                        </div>
                                        {landlordSignature && (
                                            <div className="mt-3">
                                                <h4 className="text-xs font-bold text-[#617589] uppercase tracking-wider">Preview</h4>
                                                <div className="border rounded-lg mt-1 p-2 bg-white">
                                                    <img src={landlordSignature} alt="landlord signature" className="max-h-16 object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tenant Signature */}
                                    <div className="bg-white dark:bg-background-dark border border-[#dbe0e6] dark:border-[#2a343d] rounded-xl flex flex-col p-5">
                                        <div className="flex flex-col mb-4">
                                            <h3 className="text-[#111418] dark:text-white text-base font-bold">Tenant Signature</h3>
                                            <p className="text-[#617589] text-xs font-normal">Draw tenant signature below</p>
                                        </div>
                                        <div className="relative h-32 w-full border rounded-lg bg-white">
                                            <SignatureCanvas
                                                ref={tenantSigCanvas}
                                                penColor='black'
                                                canvasProps={{className: 'w-full h-full'}}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={handleClearTenant} className="flex-1 px-3 py-1.5 rounded-lg border border-[#dbe0e6] dark:border-[#2a343d] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Clear</button>
                                            <button onClick={handleSaveTenant} className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90">Save</button>
                                        </div>
                                        {tenantSignature && (
                                            <div className="mt-3">
                                                <h4 className="text-xs font-bold text-[#617589] uppercase tracking-wider">Preview</h4>
                                                <div className="border rounded-lg mt-1 p-2 bg-white">
                                                    <img src={tenantSignature} alt="tenant signature" className="max-h-16 object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </aside>
                                {/* PDF Document Viewer Area */}
                                <section className="flex-1 flex flex-col bg-gray-200 dark:bg-[#1c2630] rounded-xl overflow-hidden border border-[#dbe0e6] dark:border-[#2a343d]">
                                    <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-8 bg-gray-200 dark:bg-[#1c2630]">
                                        {pdfUrl && (
                                            <Document
                                                file={pdfUrl}
                                                onLoadSuccess={onDocumentLoadSuccess}
                                                onLoadError={console.error}
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
                                </section>
                            </div>
                        </main>
                        {/* Fixed Finalize Footer */}
                        <footer className="sticky bottom-0 bg-white dark:bg-background-dark border-t border-[#dbe0e6] dark:border-[#2a343d] px-10 lg:px-40 py-4 flex items-center justify-between z-40">
                            <div className="flex items-center gap-6">
                                <p className="text-xs text-gray-500 max-w-md">By clicking finalize, you agree to the Terms of Service and legal binding of the electronic signatures applied.</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="px-6 h-12 rounded-lg border border-[#dbe0e6] dark:border-[#2a343d] font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Save Draft</button>
                                <button onClick={handleFinalize} className="px-8 h-12 rounded-lg bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5">Finalize and Sign</button>
                            </div>
                        </footer>
                    </div>
                </div>
            </body>
        </>
    );
}
