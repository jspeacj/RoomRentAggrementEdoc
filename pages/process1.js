
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Process1() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        propertyAddress: '',
        landlordName: '',
        tenantName: '',
        contractStartDate: '',
        contractEndDate: '',
        depositAmount: '',
        monthlyRent: '',
        specialConditions: '',
    });

    // Load existing data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('rentalData');
        if (savedData) {
            setFormData(JSON.parse(savedData));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Date helper functions
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const getDateFromNow = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };

    const getDateFromStart = (days) => {
        const startDate = formData.contractStartDate ? new Date(formData.contractStartDate) : new Date();
        startDate.setDate(startDate.getDate() + days);
        return formatDate(startDate);
    };

    const setStartDate = (days) => {
        setFormData(prev => ({ ...prev, contractStartDate: getDateFromNow(days) }));
    };

    const setEndDate = (days) => {
        setFormData(prev => ({ ...prev, contractEndDate: getDateFromStart(days) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('rentalData', JSON.stringify(formData));
        router.push('/process2');
    };

    return (
        <>
            <Head>
                <title>RentGen - Contract Information Entry</title>
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
                    .material-symbols-outlined {
                        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    }
                    .active-step {
                        background-color: #137fec15;
                        border-left: 4px solid #137fec;
                    }
                `}} />
            </Head>
            <div className="bg-background-light font-display text-[#111418] min-h-screen">
                <div className="flex h-screen overflow-hidden">
                    {/* SideNavBar */}
                    <aside className="w-72 bg-white border-r border-[#dbe0e6] flex flex-col justify-between p-6">
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <h1 className="text-xl font-bold tracking-tight">RentGen</h1>
                                </div>
                                <p className="text-[#617589] text-xs font-medium uppercase tracking-wider">Contract Builder</p>
                            </div>
                            <nav className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 px-3 py-3 rounded-lg active-step">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    <p className="text-primary text-sm font-semibold">Contract Info</p>
                                </div>
                                <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <span className="material-symbols-outlined text-[#617589] group-hover:text-primary">draw</span>
                                    <p className="text-[#111418] text-sm font-medium">Signature</p>
                                </div>
                                <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <span className="material-symbols-outlined text-[#617589] group-hover:text-primary">task_alt</span>
                                    <p className="text-[#111418] text-sm font-medium">Finalize</p>
                                </div>
                            </nav>
                        </div>
                    </aside>
                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-[1000px] mx-auto px-8 py-10">
                            {/* PageHeading */}
                            <div className="mb-10">
                                <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-widest">Step 1 of 3</p>
                                <h1 className="text-[#111418] text-4xl font-black leading-tight tracking-tight mb-3">Rent Contract Information Entry</h1>
                                <p className="text-[#617589] text-lg max-w-2xl">Fill in the primary details of the lease agreement. These details will be used to generate your legally binding document.</p>
                            </div>
                            {/* Form Section */}
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white rounded-xl border border-[#dbe0e6] shadow-sm overflow-hidden">
                                    <div className="p-8 space-y-8">
                                        {/* Property and Parties */}
                                        <div>
                                            <h2 className="text-[#111418] text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">home</span>
                                                Property &amp; Parties
                                            </h2>
                                            <p className="text-[#617589] text-sm">Enter the property address, and the names of the landlord and tenant.</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                            <input name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" placeholder="Property Address" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <input name="landlordName" value={formData.landlordName} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" placeholder="Landlord Name" />
                                                <input name="tenantName" value={formData.tenantName} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" placeholder="Tenant Name" />
                                            </div>
                                        </div>

                                        {/* Contract Term */}
                                        <div>
                                            <h2 className="text-[#111418] text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">calendar_today</span>
                                                Contract Term
                                            </h2>
                                            <p className="text-[#617589] text-sm">Specify the start and end dates of the contract.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#617589]">Start Date</label>
                                                <input name="contractStartDate" type="date" value={formData.contractStartDate} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" />
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => setStartDate(0)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">Today</button>
                                                    <button type="button" onClick={() => setStartDate(7)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">+1 Week</button>
                                                    <button type="button" onClick={() => setStartDate(30)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">+1 Month</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#617589]">End Date</label>
                                                <input name="contractEndDate" type="date" value={formData.contractEndDate} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" />
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => setEndDate(7)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">+1 Week</button>
                                                    <button type="button" onClick={() => setEndDate(30)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">+1 Month</button>
                                                    <button type="button" onClick={() => setEndDate(180)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">+6 Months</button>
                                                    <button type="button" onClick={() => setEndDate(365)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#dbe0e6] hover:bg-primary hover:text-white hover:border-primary transition-colors">+1 Year</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financials */}
                                        <div>
                                            <h2 className="text-[#111418] text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">monetization_on</span>
                                                Financials
                                            </h2>
                                            <p className="text-[#617589] text-sm">Enter the deposit and rent.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <input name="depositAmount" type="number" value={formData.depositAmount} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" placeholder="Deposit Amount ($)" />
                                            <input name="monthlyRent" type="number" value={formData.monthlyRent} onChange={handleChange} className="form-input flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-14 placeholder:text-[#617589] p-4 text-base" placeholder="Monthly Rent ($)" />
                                        </div>

                                        {/* Special Conditions */}
                                        <div>
                                            <h2 className="text-[#111418] text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">gavel</span>
                                                Special Conditions
                                            </h2>
                                            <p className="text-[#617589] text-sm">Add any special conditions to the contract.</p>
                                        </div>
                                        <textarea name="specialConditions" value={formData.specialConditions} onChange={handleChange} className="form-textarea flex w-full rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] bg-white focus:border-primary h-32 placeholder:text-[#617589] p-4 text-base" placeholder="Enter any special conditions..."></textarea>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="bg-gray-50 border-t border-[#dbe0e6] px-8 py-6 flex justify-end items-center">
                                        <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-primary/20">
                                            Next: Add Signature
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
