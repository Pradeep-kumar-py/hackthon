import React from 'react'

const Error = ({ message = "Something went wrong. Unable to fetch data from the API.", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 bg-red-50 dark:bg-gray-900 rounded-lg shadow-lg">
      <img
        src="/img1.jpeg"
        alt="Error illustration"
        className="w-32 h-32 object-contain mb-6 rounded-full shadow-md border-4 border-red-200"
        draggable={false}
      />
      <div className="text-6xl mb-4">🚨</div>
      <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">API Error</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-semibold"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default Error