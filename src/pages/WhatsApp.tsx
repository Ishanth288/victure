import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsAppPage() {

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <Card className="w-full max-w-2xl">
            <CardHeader className="pb-8">
              <div className="mx-auto mb-6">
                {/* Construction Icon */}
                <div className="w-24 h-24 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                WhatsApp Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h2 className="text-2xl font-semibold text-yellow-800 mb-3">
                    🚧 Under Construction 🚧
                  </h2>
                  <p className="text-lg text-yellow-700 mb-4">
                    We're working hard to bring you WhatsApp integration for your pharmacy!
                  </p>
                  <p className="text-gray-600">
                    This feature will allow you to:
                  </p>
                  <ul className="text-left text-gray-600 mt-3 space-y-2">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Send automated appointment reminders
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Notify patients about prescription refills
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Send follow-up care messages
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Manage patient communication efficiently
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    📅 Expected Launch: Coming Soon
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    We'll notify you once this feature is ready!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}