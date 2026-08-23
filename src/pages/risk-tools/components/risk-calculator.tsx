// @ts-nocheck
import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './risk-calculator.scss';

interface DayBreakdown {
    day: number;
    capital: number;
    session1: number;
    session2: number;
    session3: number;
    profit: number;
    reinvest: number;
    withdraw: number;
    endingCapital: number;
}

const RiskCalculator: React.FC = () => {
    const [startingCapitalInput, setStartingCapitalInput] = useState<string>(
        () => localStorage.getItem('risk_calc_starting_capital') || '40'
    );
    const [numberOfDaysInput, setNumberOfDaysInput] = useState<string>(
        () => localStorage.getItem('risk_calc_number_of_days') || '30'
    );
    const [dailyTargetInput, setDailyTargetInput] = useState<string>(
        () => localStorage.getItem('risk_calc_daily_target') || '9'
    );

    const initialCap = parseFloat(startingCapitalInput) || 40;
    const initialDays = parseInt(numberOfDaysInput, 10) || 30;
    const initialTarget = parseFloat(dailyTargetInput) || 9;

    const [appliedConfig, setAppliedConfig] = useState<{
        capital: number;
        days: number;
        targetPct: number;
    } | null>({
        capital: initialCap,
        days: initialDays,
        targetPct: initialTarget,
    });

    const handleCapitalChange = (val: string) => {
        setStartingCapitalInput(val);
        localStorage.setItem('risk_calc_starting_capital', val);
    };

    const handleDaysChange = (val: string) => {
        setNumberOfDaysInput(val);
        localStorage.setItem('risk_calc_number_of_days', val);
    };

    const handleTargetChange = (val: string) => {
        setDailyTargetInput(val);
        localStorage.setItem('risk_calc_daily_target', val);
    };

    const handleCalculate = () => {
        const cap = parseFloat(startingCapitalInput);
        const days = parseInt(numberOfDaysInput, 10);
        const target = parseFloat(dailyTargetInput);

        if (isNaN(cap) || cap <= 0 || isNaN(days) || days <= 0 || isNaN(target) || target <= 0) {
            return;
        }

        setAppliedConfig({
            capital: cap,
            days,
            targetPct: target,
        });
    };

    const scheduleData = useMemo(() => {
        if (!appliedConfig) return null;

        const { capital: startCap, days, targetPct } = appliedConfig;
        const rows: DayBreakdown[] = [];

        let currentCapital = startCap;
        let totalProfitSum = 0;
        let totalWithdrawSum = 0;

        for (let i = 1; i <= days; i++) {
            const dayCapital = currentCapital;
            const totalDailyProfit = dayCapital * (targetPct / 100);
            const sessionAmount = totalDailyProfit / 3;

            let reinvest = 0;
            let withdraw = 0;

            if (i === days) {
                // Final day: Re-invest is 0, withdrawal includes full session profits + accrued capital
                reinvest = 0;
                withdraw = dayCapital + totalDailyProfit;
            } else {
                reinvest = totalDailyProfit * 0.5;
                withdraw = totalDailyProfit * 0.5;
            }

            rows.push({
                day: i,
                capital: dayCapital,
                session1: sessionAmount,
                session2: sessionAmount,
                session3: sessionAmount,
                profit: totalDailyProfit,
                reinvest,
                withdraw,
                endingCapital: dayCapital + reinvest,
            });

            totalProfitSum += totalDailyProfit;
            if (i < days) {
                totalWithdrawSum += withdraw;
            } else {
                totalWithdrawSum += withdraw; // includes ending capital
            }

            currentCapital = dayCapital + reinvest;
        }

        const netProfit = totalProfitSum;
        const totalWithdrawn = totalWithdrawSum;

        return {
            rows,
            totalProfit: netProfit,
            totalWithdrawn: totalWithdrawn,
            finalBalance: 0,
        };
    }, [appliedConfig]);

    const handleDownloadPDF = () => {
        if (!scheduleData || !appliedConfig) return;

        const doc = new jsPDF('p', 'mm', 'a4');

        // Header Title
        doc.setFillColor(15, 23, 42); // dark navy
        doc.rect(0, 0, 210, 28, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('30 Day Capital Growth Challenge', 14, 18);

        // Subtitle Config
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Starting Capital: $${appliedConfig.capital.toFixed(2)}  |  Duration: ${appliedConfig.days} Days  |  Daily Target: ${appliedConfig.targetPct}%`,
            14,
            36
        );

        // Table headers & data
        const tableHeaders = [['#', 'Capital', 'Session 1', 'Session 2', 'Session 3', 'Profit', 'Re-Invest', 'Withdraw']];
        const tableBody = scheduleData.rows.map(r => [
            `Day ${r.day}`,
            `$${r.capital.toFixed(2)}`,
            `+$${r.session1.toFixed(2)}`,
            `+$${r.session2.toFixed(2)}`,
            `+$${r.session3.toFixed(2)}`,
            `+$${r.profit.toFixed(2)}`,
            r.day === appliedConfig.days ? '-' : `$${r.reinvest.toFixed(2)}`,
            `$${r.withdraw.toFixed(2)}`,
        ]);

        // Append Totals row
        tableBody.push([
            'Totals',
            '',
            '',
            '',
            '',
            `+$${scheduleData.totalProfit.toFixed(2)}`,
            '-',
            `$${scheduleData.totalWithdrawn.toFixed(2)}`,
        ]);

        autoTable(doc, {
            startY: 42,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [15, 30, 66],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 8.5,
                halign: 'center',
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { fontStyle: 'bold', halign: 'left' },
                5: { textColor: [22, 163, 74], fontStyle: 'bold' },
                6: { textColor: [37, 99, 235] },
                7: { textColor: [217, 119, 6], fontStyle: 'bold' },
            },
        });

        doc.save(`Capital_Growth_Challenge_${appliedConfig.days}Days.pdf`);
    };

    return (
        <div className='risk-calculator-page'>
            <div className='risk-calculator-container'>
                {/* Section Title */}
                <div className='risk-calculator-header'>
                    <h1 className='risk-calculator-title'>
                        <span className='risk-calculator-title-bar'></span>
                        30 Day Capital Growth Challenge
                    </h1>
                    <p className='risk-calculator-subtitle'>
                        Enter your values, generate your schedule, then download the full plan as PDF.
                    </p>
                </div>

                {/* Controls Card */}
                <div className='risk-calculator-controls'>
                    <div className='input-group'>
                        <label className='input-label'>
                            <span className='dot green'></span> Starting Capital
                        </label>
                        <div className='input-wrapper'>
                            <span className='prefix'>$</span>
                            <input
                                type='number'
                                className='input-field'
                                value={startingCapitalInput}
                                onChange={e => handleCapitalChange(e.target.value)}
                                placeholder='40'
                            />
                        </div>
                    </div>

                    <div className='input-group'>
                        <label className='input-label'>
                            <span className='dot green'></span> Number of Days
                        </label>
                        <div className='input-wrapper'>
                            <input
                                type='number'
                                className='input-field'
                                value={numberOfDaysInput}
                                onChange={e => handleDaysChange(e.target.value)}
                                placeholder='30'
                            />
                            <span className='suffix'>days</span>
                        </div>
                    </div>

                    <div className='input-group'>
                        <label className='input-label'>
                            <span className='dot green'></span> Daily Target
                        </label>
                        <div className='input-wrapper'>
                            <input
                                type='number'
                                className='input-field'
                                value={dailyTargetInput}
                                onChange={e => handleTargetChange(e.target.value)}
                                placeholder='9'
                            />
                            <span className='suffix'>%</span>
                        </div>
                        <span className='recommended-badge'>Recommended: 30%</span>
                    </div>

                    <div className='actions-group'>
                        <button className='btn-calculate' onClick={handleCalculate}>
                            Calculate
                        </button>
                        <button
                            className='btn-pdf'
                            onClick={handleDownloadPDF}
                            disabled={!scheduleData}
                        >
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Breakdown Schedule Table & Summary */}
                {scheduleData && appliedConfig && (
                    <div className='risk-calculator-results'>
                        <div className='table-card'>
                            <table className='breakdown-table'>
                                <thead>
                                    <tr>
                                        <th className='col-day'>#</th>
                                        <th>Capital</th>
                                        <th>Session 1</th>
                                        <th>Session 2</th>
                                        <th>Session 3</th>
                                        <th>Profit</th>
                                        <th>Re-Invest</th>
                                        <th className='col-withdraw'>Withdraw</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduleData.rows.map(r => (
                                        <tr key={r.day} className={r.day === appliedConfig.days ? 'last-day-row' : ''}>
                                            <td className='col-day'>Day {r.day}</td>
                                            <td>${r.capital.toFixed(2)}</td>
                                            <td className='text-green'>+${r.session1.toFixed(2)}</td>
                                            <td className='text-green'>+${r.session2.toFixed(2)}</td>
                                            <td className='text-green'>+${r.session3.toFixed(2)}</td>
                                            <td className='text-green font-bold'>+${r.profit.toFixed(2)}</td>
                                            <td className='text-blue'>
                                                {r.day === appliedConfig.days ? '-' : r.reinvest.toFixed(2)}
                                            </td>
                                            <td className='col-withdraw font-bold'>
                                                ${r.withdraw.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className='totals-row'>
                                        <td className='col-day'>Totals</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className='text-green font-bold'>
                                            +${scheduleData.totalProfit.toFixed(2)}
                                        </td>
                                        <td>-</td>
                                        <td className='col-withdraw font-bold'>
                                            ${scheduleData.totalWithdrawn.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Summary Cards */}
                        <div className='summary-cards-grid'>
                            <div className='summary-card'>
                                <div className='summary-label'>Initial Capital</div>
                                <div className='summary-value text-blue'>${appliedConfig.capital.toFixed(2)}</div>
                            </div>
                            <div className='summary-card card-green'>
                                <div className='summary-label'>Total Profit Gained</div>
                                <div className='summary-value text-green'>+${scheduleData.totalProfit.toFixed(2)}</div>
                            </div>
                            <div className='summary-card card-amber'>
                                <div className='summary-label'>Total Withdrawn</div>
                                <div className='summary-value text-amber'>${scheduleData.totalWithdrawn.toFixed(2)}</div>
                            </div>
                            <div className='summary-card card-cyan'>
                                <div className='summary-label'>Balance After Challenge</div>
                                <div className='summary-value text-cyan'>$0.00</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskCalculator;
