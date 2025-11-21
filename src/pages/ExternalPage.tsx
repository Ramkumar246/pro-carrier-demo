/**
 * External Page Component
 * 
 * This page is designed to host content from another React repository.
 * 
 * Integration Steps:
 * 1. Copy the component files from the external repo into this project
 * 2. Copy any required dependencies to package.json
 * 3. Copy any required assets (images, styles, etc.) to the public or src/assets folder
 * 4. Update the imports below to match your external component structure
 * 5. Ensure all dependencies are installed: npm install
 */

const ExternalPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">External Page</h1>
          <p className="text-muted-foreground mt-1">
            This page will host content from your external repository
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-lg mx-auto flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Ready for Integration</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Replace this placeholder with your external component. 
              See the integration guide in the project root for detailed instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="bg-muted/50 rounded-lg border border-border p-6">
        <h3 className="font-semibold mb-3">Quick Integration Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Copy your component files to <code className="bg-background px-1 rounded">src/components/external/</code></li>
          <li>Copy required dependencies to <code className="bg-background px-1 rounded">package.json</code></li>
          <li>Copy assets to <code className="bg-background px-1 rounded">public/</code> or <code className="bg-background px-1 rounded">src/assets/</code></li>
          <li>Import and render your component in this file</li>
          <li>Run <code className="bg-background px-1 rounded">npm install</code> to install dependencies</li>
        </ol>
      </div>
    </div>
  );
};

export default ExternalPage;

