


import React, { useState } from 'react';
import { CameraIcon, StarIcon, HeartIcon, ShareIcon, ShoppingCartIcon, ArrowDownTrayIcon, CubeTransparentIcon, TruckIcon, CpuChipIcon, UserCircleIcon, CheckCircleIcon, HandThumbUpIcon, SearchIcon, MapPinIcon, ScaleIcon, DocumentTextIcon, AcademicCapIcon, BeakerIcon } from './Icons';
import { commerceData, courses } from '../data';
import { SmartContractOption, TechnicalSpecification } from '../types';

const ProductInfoCard: React.FC<{title: string, children: React.ReactNode, icon?: React.FC<any>}> = ({title, children, icon: Icon}) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-500"/>} {title}
        </h3>
        {children}
    </div>
)

const ReviewList: React.FC = () => (
    <div className="space-y-6">
        {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                    <UserCircleIcon className="w-8 h-8 text-gray-400"/>
                    <span className="font-bold text-sm">Verified Buyer {i}</span>
                </div>
                <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, x) => <StarIcon key={x} solid={x < 4} className="w-4 h-4"/>)}
                    </div>
                    <span className="text-xs text-gray-500 ml-2 font-bold">Verified Purchase</span>
                </div>
                <h4 className="font-bold text-sm mb-1">Great product, fast shipping!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    I was skeptical at first, but this item exceeded my expectations. The build quality is solid and it integrates perfectly with my existing Aetherius OS setup.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                        <HandThumbUpIcon className="w-4 h-4"/> Helpful (12)
                    </button>
                    <span>Report</span>
                </div>
            </div>
        ))}
    </div>
);

const QuestionsList: React.FC = () => (
    <div className="space-y-4">
        <div className="flex gap-2">
            <input type="text" placeholder="Have a question? Search for answers" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700" />
            <button className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md"><SearchIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
        </div>
        {[1, 2].map(i => (
            <div key={i} className="space-y-2">
                <div className="flex gap-2">
                    <span className="font-bold text-sm">Q:</span>
                    <a href="#" className="text-sm text-blue-600 hover:underline font-semibold">Does this work with the Quantum Core v1?</a>
                </div>
                <div className="flex gap-2">
                    <span className="font-bold text-sm">A:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Yes, it is fully backward compatible. You just need to update your firmware to version 24H2.</span>
                </div>
                <div className="ml-6 text-xs text-gray-500">By Manufacturer on Jan 15, 2025</div>
            </div>
        ))}
    </div>
);

// --- NEW: Technical Specs View ---
const TechnicalSpecsView: React.FC<{ specs: TechnicalSpecification }> = ({ specs }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <ScaleIcon className="w-4 h-4 text-purple-500"/> Patent Information
                    </h4>
                    <p className="text-sm"><span className="font-semibold">Patent #:</span> {specs.patentNumber || 'Pending'}</p>
                    <p className="text-sm"><span className="font-semibold">Status:</span> <span className="text-green-500">{specs.patentStatus || 'N/A'}</span></p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <CubeTransparentIcon className="w-4 h-4 text-blue-500"/> Physical Attributes
                    </h4>
                    <p className="text-sm"><span className="font-semibold">Weight:</span> {specs.weight || 'N/A'}</p>
                    <p className="text-sm"><span className="font-semibold">Dimensions:</span> {specs.dimensions || 'N/A'}</p>
                </div>
            </div>

            {specs.materials && (
                <div>
                    <h4 className="font-bold text-sm mb-2">Material Composition</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {specs.materials.map((m, i) => (
                            <li key={i} className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-1">
                                <span>{m.name}</span>
                                <span className="font-mono text-xs opacity-70">{m.percentage}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {specs.blueprints && specs.blueprints.length > 0 && (
                <div>
                    <h4 className="font-bold text-sm mb-2">Blueprints & Schematics</h4>
                    <div className="space-y-2">
                        {specs.blueprints.map((bp, i) => (
                             <button key={i} className="flex items-center justify-between w-full p-2 text-left text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <span className="flex items-center gap-2"><DocumentTextIcon className="w-4 h-4"/> {bp.title}</span>
                                <ArrowDownTrayIcon className="w-4 h-4"/>
                             </button>
                        ))}
                    </div>
                </div>
            )}

             {specs.processSteps && (
                <div>
                    <h4 className="font-bold text-sm mb-2">Manufacturing Process</h4>
                    <div className="flex flex-wrap gap-2">
                        {specs.processSteps.map((step, i) => (
                             <span key={i} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">{i+1}. {step}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- NEW: Licensing & Rights View ---
const LicensingView: React.FC<{ options: SmartContractOption[] }> = ({ options }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
                Select a smart contract template to acquire usage rights. All transactions are recorded on the OmniChain.
            </p>
            {options.map((opt) => (
                <div key={opt.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">{opt.type} License</h4>
                        <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded">{opt.price} {opt.currency}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{opt.terms}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                        {opt.rights.map((right, i) => (
                             <span key={i} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">{right}</span>
                        ))}
                    </div>
                    <button className="w-full py-2 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        View Contract
                    </button>
                </div>
            ))}
        </div>
    );
};

// --- NEW: Learning Integration Card ---
const LearningCard: React.FC<{ relatedIds: number[], onSetView: Function }> = ({ relatedIds, onSetView }) => {
    if (!relatedIds || relatedIds.length === 0) return null;
    
    // Mock fetching course data based on ID
    const relatedCourses = courses.filter(c => relatedIds.includes(c.id));
    
    return (
        <ProductInfoCard title="Learn to Build This" icon={AcademicCapIcon}>
            <div className="space-y-3">
                {relatedCourses.map(course => (
                    <div key={course.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => onSetView('courseDetail', { courseId: course.id })}>
                        <img src={course.imageUrl} className="w-10 h-10 object-cover rounded" alt={course.title}/>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{course.title}</p>
                            <p className="text-[10px] text-gray-500">by {course.instructor}</p>
                        </div>
                        <ArrowDownTrayIcon className="w-4 h-4 text-blue-500 -rotate-90"/>
                    </div>
                ))}
            </div>
        </ProductInfoCard>
    );
};

export const ProductPage: React.FC<{ context?: { productId?: string }, onSetView: Function }> = ({ context, onSetView }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'qa' | 'specs'>('details');
  const allItems = [...commerceData.physical, ...commerceData.digitalGoods, ...commerceData.apps];
  const defaultProduct = allItems[0];
  
  // Find product from combined list
  const product = context?.productId 
    ? allItems.find(p => p.id === context.productId) || defaultProduct
    : defaultProduct;

  const isPhysical = product.deliveryMethod === 'shipping';
  const isDigital = product.deliveryMethod === 'digital-download';
  const isCAD = product.digitalType === 'cad';

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
      {/* Left Column - Image and Media */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-center h-96 overflow-hidden relative group">
          {isCAD ? (
              <div className="flex flex-col items-center justify-center text-gray-400">
                  <CubeTransparentIcon className="w-24 h-24 mb-4 opacity-50 animate-spin-slow" style={{animationDuration: '20s'}}/>
                  <p>Interactive 3D Viewer (Preview)</p>
                  <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-xs font-mono text-white">Format: {product.fileFormat}</div>
              </div>
          ) : product.iconUrl ? (
              <img src={product.iconUrl} alt={product.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <CameraIcon className="w-16 h-16 text-gray-300 dark:text-gray-400" />
              </div>
          )}
        </div>
        
        {/* Tabbed Content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('details')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Details
                </button>
                <button 
                    onClick={() => setActiveTab('specs')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'specs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Specs & Rights
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Reviews (121)
                </button>
                <button 
                    onClick={() => setActiveTab('qa')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'qa' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Q&A (4)
                </button>
            </div>
            
            <div className="p-6">
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.description}</p>
                        {product.systemRequirements && (
                            <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                <CpuChipIcon className="w-5 h-5 text-gray-500"/>
                                <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">{product.systemRequirements}</code>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                            <div><span className="font-bold">SKU:</span> GEN-{product.id.toUpperCase()}</div>
                            <div><span className="font-bold">Category:</span> {product.type}</div>
                            <div><span className="font-bold">Seller:</span> {product.creator.name}</div>
                        </div>
                    </div>
                )}
                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {product.technicalSpecs ? (
                            <TechnicalSpecsView specs={product.technicalSpecs} />
                        ) : (
                            <div className="text-gray-500 text-sm italic">No technical specifications available for this product.</div>
                        )}
                        
                        {product.licensingOptions && (
                            <div>
                                <h4 className="font-bold text-sm mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <ScaleIcon className="w-4 h-4 text-blue-500"/> Intellectual Property & Licensing
                                </h4>
                                <LicensingView options={product.licensingOptions} />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'reviews' && <ReviewList />}
                {activeTab === 'qa' && <QuestionsList />}
            </div>
        </div>
        
        {/* Frequently Bought Together */}
        <ProductInfoCard title="Frequently Bought Together">
             <div className="flex items-center gap-4 overflow-x-auto py-2">
                 <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                     <img src={product.iconUrl} className="w-16 h-16 object-contain" />
                 </div>
                 <span className="text-gray-400 text-xl">+</span>
                 <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-500 font-bold">Accessory</div>
                 </div>
                 <div className="flex-1 ml-4">
                     <div className="text-sm font-bold text-gray-800 dark:text-white">Total price: ${((typeof product.price === 'number' ? product.price : 0) + 25).toFixed(2)}</div>
                     <button className="mt-2 px-4 py-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded shadow-sm">Add both to Cart</button>
                 </div>
             </div>
        </ProductInfoCard>

      </div>

      {/* Right Column - Product Details & Buy */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md sticky top-4">
            <div className="flex justify-between items-start">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
                <button className="text-gray-400 hover:text-red-500 transition-colors"><HeartIcon className="w-6 h-6"/></button>
            </div>
            <p className="text-sm text-blue-600 cursor-pointer hover:underline mt-1">Visit the {product.creator.name} Store</p>
            
            <div className="flex items-center my-3">
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => <StarIcon key={i} solid className="w-4 h-4" />)}
              </div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 cursor-pointer">121 ratings</span>
            </div>

            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4">
                <div className="flex items-start gap-1">
                    <span className="text-xs mt-1">$</span>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {product.price === 'Free' ? '0.00' : Math.floor(product.price)}
                    </p>
                    <span className="text-xs mt-1">{product.price !== 'Free' && ((product.price % 1) * 100).toFixed(0)}</span>
                </div>
                
                {isPhysical && (
                    <div className="mt-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-gray-400 line-through">$1,499.00</span>
                            <span className="text-xs">List Price</span>
                        </div>
                        <div className="mt-2 flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <TruckIcon className="w-5 h-5 text-gray-400 mt-0.5"/>
                            <div>
                                <span className="block text-blue-600">FREE delivery</span>
                                <span className="font-bold">Thursday, Oct 24</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-green-600 text-sm font-semibold">
                            <MapPinIcon className="w-4 h-4"/>
                            Deliver to San Francisco 94103
                        </div>
                        <div className="mt-4 text-lg text-green-600 font-bold">In Stock</div>
                    </div>
                )}
                {isDigital && (
                     <div className="mt-2 flex items-center gap-2 text-sm text-green-500 font-semibold">
                        <ArrowDownTrayIcon className="w-4 h-4"/>
                        <span>Available Immediately</span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span>Quantity:</span>
                    <select className="border border-gray-300 rounded p-1 bg-gray-100 dark:bg-gray-700">
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <button className="w-full bg-yellow-400 text-black font-bold py-3 rounded-full hover:bg-yellow-500 transition-colors shadow-sm">
                    Add to Cart
                </button>
                <button className="w-full bg-orange-500 text-white font-bold py-3 rounded-full hover:bg-orange-600 transition-colors shadow-sm">
                    Buy Now
                </button>
                
                <div className="text-xs text-gray-500 mt-4 space-y-1">
                    <div className="flex justify-between"><span>Ships from</span> <span>Aetherius</span></div>
                    <div className="flex justify-between"><span>Sold by</span> <span className="text-blue-600">{product.creator.name}</span></div>
                    <div className="flex justify-between"><span>Returns</span> <span className="text-blue-600">30-day return policy</span></div>
                </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button className="w-full border border-gray-300 dark:border-gray-600 py-1 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Add to List</button>
            </div>
        </div>

        {/* Learning Integration */}
        {product.relatedCourseIds && (
            <LearningCard relatedIds={product.relatedCourseIds} onSetView={onSetView} />
        )}

        {/* Protection Plan */}
        {isPhysical && (
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                 <h4 className="font-bold text-sm mb-2">Add Protection Plan</h4>
                 <div className="space-y-2">
                     <label className="flex items-start gap-2 cursor-pointer">
                         <input type="checkbox" className="mt-1" />
                         <span className="text-sm text-gray-600 dark:text-gray-300">3-Year Protection for <span className="text-red-600">$129.99</span></span>
                     </label>
                     <label className="flex items-start gap-2 cursor-pointer">
                         <input type="checkbox" className="mt-1" />
                         <span className="text-sm text-gray-600 dark:text-gray-300">2-Year Protection for <span className="text-red-600">$89.99</span></span>
                     </label>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};