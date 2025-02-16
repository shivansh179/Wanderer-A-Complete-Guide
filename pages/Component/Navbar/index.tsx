import React from 'react';

const Index = () => {
  return (
    <div className="flex p-4 w-full bg-blue-700 justify-between items-center">
      <div className="w-1/2 text-white font-bold text-2xl">Logo</div>
      <div className="flex w-1/2 justify-end space-x-4">
        <button className="text-white px-4 py-2 hover:bg-blue-600 rounded-md">Home</button>
        <button className="text-white px-4 py-2 hover:bg-blue-600 rounded-md">Plan</button>
      </div>
    </div>
  );
};

export default Index;
