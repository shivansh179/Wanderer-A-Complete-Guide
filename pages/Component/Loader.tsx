import React from 'react';
import { ThreeDots } from 'react-loader-spinner';

interface LoaderProps {
    height?: string | number;
    width?: string | number;
    color?: string;
}
const Loader: React.FC<LoaderProps> = ({ height = 40, width = 40, color = "#6366F1" }) => {
    return (
        <div className="flex flex-col items-center justify-center h-48">
            <ThreeDots height={height} width={width} color={color} />
            <p className="mt-4 text-gray-600 text-lg">
                Summoning the travel spirits...
            </p>
        </div>
    );
};

export default Loader;