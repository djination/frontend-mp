/**
 * Fungsi untuk generate account_no sesuai rules:
 * - Jika parent: YYMMDD-0001 (sequence)
 * - Jika child/branch/sub-branch: account_no parent + -001 (sequence)
 * 
 * @param {'Parent'|'Child'|'Branch'|'Sub-Branch'} accountType
 * @param {string|null} parentAccountNo - account_no parent (jika ada)
 * @param {number} sequence - urutan (mulai dari 1)
 * @returns {string}
 */
export function generateAccountNo(accountType, parentAccountNo = null, sequence = 1) {
  const padSeq = (seq) => String(seq).padStart(3, '0');
  const padSeq4 = (seq) => String(seq).padStart(4, '0');
  const today = new Date();
  const YY = String(today.getFullYear()).slice(-2);
  const MM = String(today.getMonth() + 1).padStart(2, '0');
  const DD = String(today.getDate()).padStart(2, '0');
  let accountNo = '';

  if (accountType === 'Parent') {
    // YYMMDD-0001
    accountNo = `${YY}${MM}${DD}-${padSeq4(sequence)}`;
  } else if (['Child', 'Branch', 'Sub-Branch'].includes(accountType)) {
    if (!parentAccountNo) throw new Error('Parent account_no is required for child/branch/sub-branch');
    // Tambahkan -001 (atau urutan)
    accountNo = `${parentAccountNo}-${padSeq(sequence)}`;
  } else {
    throw new Error('Invalid account type');
  }

  return accountNo;
}