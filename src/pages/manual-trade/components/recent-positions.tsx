import React from 'react';
import './recent-positions.scss';

// Temporary placeholder for active/closed manual trades
const RecentPositions = () => {
    return (
        <div className='recent-positions'>
            <div className='recent-positions__header'>
                <h4>Recent Trades</h4>
            </div>
            <div className='recent-positions__list'>
                <div className='recent-positions__empty'>
                    <p>No recent trades</p>
                </div>
            </div>
        </div>
    );
};

export default RecentPositions;
