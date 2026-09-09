import React from 'react';
import { ShieldCheck, FileText, X, Lock, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-sky-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Điều Khoản Sử Dụng & Chính Sách Bảo Mật</h2>
              <p className="text-xs text-slate-600">ProfitCal Ecom Audit Tool • Official https://profitcal.tagki.com</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legal Text Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 leading-relaxed">
          
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>CAM KẾT BẢO MẬT DỮ LIỆU TUYỆT ĐỐI (100% CLIENT-SIDE)</span>
            </div>
            <p className="text-[11px] text-slate-700">
              ProfitCal hoạt động 100% trên Trình duyệt máy tính của bạn (Client-side Web Assembly). Chúng tôi KHÔNG lưu trữ, KHÔNG tải lên server bất kỳ file Excel đối soát, tên khách hàng, SĐT hay dữ liệu doanh thu shop nào của bạn.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">1. Quy Định Về Quyền Sở Hữu & Sử Dụng Phần Mềm</h3>
            <p>
              - ProfitCal là công cụ hỗ trợ các chủ shop TMĐT (Shopee, TikTok Shop) tính toán Lợi Nhuận Ròng, bóc tách Phí sàn, Thuế TMĐT 1.5% và chuẩn hóa mẫu file vận chuyển.<br />
              - Người dùng có quyền truy cập miễn phí bản FREE với giới hạn 20 đơn/lượt ghép (reset sau 7 ngày) hoặc nâng cấp bản PRO để dùng không giới hạn.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">2. Chính Sách Hoàn Tiền Gói PRO</h3>
            <p>
              - Chúng tôi cam kết hoàn tiền 100% trong vòng <strong>7 ngày</strong> kể từ khi kích hoạt gói PRO nếu công cụ không mang lại giá trị hoặc bị lỗi kỹ thuật không thể khắc phục.<br />
              - Mọi yêu cầu bồi hoàn vui lòng liên hệ qua Zalo/Telegram hỗ trợ trực tiếp.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">3. Giới Hạn Trách Nhiệm Phản Ánh Dữ Liệu</h3>
            <p>
              - Số liệu tính toán dựa trên file báo cáo đối soát xuất trực tiếp từ Kênh Người Bán Shopee / TikTok Shop và thông số Giá vốn do người dùng cung cấp.<br />
              - ProfitCal không chịu trách nhiệm trong trường hợp file đối soát gốc từ sàn bị sai lệch số liệu hoặc bị thay đổi định dạng cột ngoài chuẩn mặc định.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sky-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 text-navy-950 font-bold text-xs rounded-xl shadow-lg hover:bg-emerald-400"
          >
            Đã Hiểu & Đồng Ý
          </button>
        </div>

      </div>
    </div>
  );
};
