gRecord({ ...editingRecord, fifth_pay_comission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">6th Pay Commission</label>
                    <select
                      value={editingRecord.sixth_pay_comission || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, sixth_pay_comission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="आहे">आहे (Available)</option>
                      <option value="नाही">नाही (Not Available)</option>
                      <option value="लागू नाही">लागू नाही (Not Applicable)</option>
                      <option value="सुट आहे">सुट आहे (Exempted)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">6th Pay Commission Date</label>
                    <input
                      type="date"
                      value={editingRecord.sixth_pay_comission_date ? editingRecord.sixth_pay_comission_date.split('T')[0] : ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, sixth_pay_comission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">7th Pay Commission</label>
                    <select
                      value={editingRecord.seventh_pay_comission || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, seventh_pay_comission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="आहे">आहे (Available)</option>
                      <option value="नाही">नाही (Not Available)</option>
                      <option value="लागू नाही">लागू नाही (Not Applicable)</option>
                      <option value="सुट आहे">सुट आहे (Exempted)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">7th Pay Commission Date</label>
                    <input
                      type="date"
                      value={editingRecord.seventh_pay_comission_date ? editingRecord.seventh_pay_comission_date.split('T')[0] : ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, seventh_pay_comission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Pay Commission Comments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">4th Pay Commission Comment</label>
                    <textarea
                      value={editingRecord.fourth_pay_comission_comment || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, fourth_pay_comission_comment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter comment for 4th pay commission"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">5th Pay Commission Comment</label>
                    <textarea
                      value={editingRecord.fifth_pay_comission_comment || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, fifth_pay_comission_comment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter comment for 5th pay commission"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">6th Pay Commission Comment</label>
                    <textarea
                      value={editingRecord.sixth_pay_comission_comment || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, sixth_pay_comission_comment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter comment for 6th pay commission"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">7th Pay Commission Comment</label>
                    <textarea
                      value={editingRecord.seventh_pay_comission_comment || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, seventh_pay_comission_comment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter comment for 7th pay commission"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.payProgressScheme')}</label>
                    <select
                      value={editingRecord.pay_progress_scheme || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, pay_progress_scheme: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="आहे (Available)">आहे (Available)</option>
                      <option value="नाही (Not Available)">नाही (Not Available)</option>
                      <option value="लागू नाही (Not Applicable)">लागू नाही (Not Applicable)</option>
                      <option value="सुट आहे (Exempted)">सुट आहे (Exempted)</option>
                      <option value="इतर (Other)">इतर (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.departmentProgressScheme')}</label>
                    <select
                      value={editingRecord.department_progress_scheme || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, department_progress_scheme: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="आहे (Available)">आहे (Available)</option>
                      <option value="नाही (Not Available)">नाही (Not Available)</option>
                      <option value="लागू नाही (Not Applicable)">लागू नाही (Not Applicable)</option>
                      <option value="सुट आहे (Exempted)">सुट आहे (Exempted)</option>
                      <option value="इतर (Other)">इतर (Other)</option>
                    </select>
                  </div>

                </div>

                {/* General Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">General Comments</label>
                  <textarea
                    value={editingRecord.comments || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, comments: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter general comments"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateRecord}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};