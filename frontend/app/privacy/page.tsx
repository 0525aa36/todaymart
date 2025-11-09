import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-slate max-w-none">
            <h1 className="text-4xl font-bold mb-2">개인정보 처리방침</h1>
            <p className="text-lg text-muted-foreground mb-12">
              오늘마트(이하 '회사')는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다.
            </p>

            <div className="space-y-12">
              {/* Section 1 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">1. 개인정보의 수집 및 이용 목적</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>

                <div className="ml-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">가. 회원가입 및 관리</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 목적으로 개인정보를 처리합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">나. 재화 또는 서비스 제공</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      물품배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산을 목적으로 개인정보를 처리합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">다. 마케팅 및 광고에의 활용</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계 등을 목적으로 개인정보를 처리합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">2. 수집하는 개인정보 항목</h2>

                <div className="ml-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">가. 회원가입 시</h3>
                    <table className="w-full border-collapse border border-gray-300 mb-4">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">구분</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">수집항목</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">필수</td>
                          <td className="border border-gray-300 px-4 py-3">이메일, 비밀번호, 이름, 전화번호, 주소(우편번호, 기본주소, 상세주소), 생년월일, 성별</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">선택</td>
                          <td className="border border-gray-300 px-4 py-3">마케팅 수신 동의</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">나. 소셜 로그인 이용 시</h3>
                    <table className="w-full border-collapse border border-gray-300 mb-4">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">제공업체</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">수집항목</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">네이버</td>
                          <td className="border border-gray-300 px-4 py-3">이메일, 이름, 전화번호, 생년월일, 성별</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">카카오</td>
                          <td className="border border-gray-300 px-4 py-3">이메일, 닉네임, 전화번호, 생년월일, 성별</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">다. 서비스 이용 과정에서 자동으로 생성되어 수집되는 정보</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      IP 주소, 쿠키, 서비스 이용 기록, 방문 기록, 불량 이용 기록 등
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">3. 개인정보의 보유 및 이용기간</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>

                <div className="ml-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">가. 회원정보</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      회원 탈퇴 시까지. 다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 수사·조사 종료 시까지</li>
                      <li>서비스 이용에 따른 채권·채무관계 잔존 시: 해당 채권·채무관계 정산 시까지</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">나. 관계 법령에 따른 보유</h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">보존 항목</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">보존 기간</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">근거 법령</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">계약 또는 청약철회 등에 관한 기록</td>
                          <td className="border border-gray-300 px-4 py-3">5년</td>
                          <td className="border border-gray-300 px-4 py-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">대금결제 및 재화 등의 공급에 관한 기록</td>
                          <td className="border border-gray-300 px-4 py-3">5년</td>
                          <td className="border border-gray-300 px-4 py-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">소비자의 불만 또는 분쟁처리에 관한 기록</td>
                          <td className="border border-gray-300 px-4 py-3">3년</td>
                          <td className="border border-gray-300 px-4 py-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">표시·광고에 관한 기록</td>
                          <td className="border border-gray-300 px-4 py-3">6개월</td>
                          <td className="border border-gray-300 px-4 py-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">서비스 방문기록</td>
                          <td className="border border-gray-300 px-4 py-3">3개월</td>
                          <td className="border border-gray-300 px-4 py-3">통신비밀보호법</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">4. 개인정보의 제3자 제공</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                </p>
              </section>

              {/* Section 5 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">5. 개인정보 처리의 위탁</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
                </p>

                <table className="w-full border-collapse border border-gray-300 ml-6">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">수탁업체</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">위탁업무 내용</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">보유 및 이용기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3">토스페이먼츠</td>
                      <td className="border border-gray-300 px-4 py-3">결제 및 결제대행 서비스</td>
                      <td className="border border-gray-300 px-4 py-3">회원 탈퇴 시 또는 위탁계약 종료 시</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3">택배 회사</td>
                      <td className="border border-gray-300 px-4 py-3">상품 배송</td>
                      <td className="border border-gray-300 px-4 py-3">배송 완료 시</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Section 6 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">6. 정보주체의 권리·의무 및 행사방법</h2>
                <p className="text-base leading-relaxed mb-4">
                  정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                </p>

                <div className="ml-6">
                  <ul className="list-decimal list-inside space-y-2 text-base">
                    <li>개인정보 열람 요구</li>
                    <li>오류 등이 있을 경우 정정 요구</li>
                    <li>삭제 요구</li>
                    <li>처리정지 요구</li>
                  </ul>

                  <p className="text-base leading-relaxed mt-4 text-muted-foreground">
                    제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법」 시행규칙 별지 제8호 서식에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">7. 개인정보의 파기</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                </p>

                <div className="ml-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">가. 파기절차</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다. 이 때, DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">나. 파기방법</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                      <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 8 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">8. 개인정보의 안전성 확보조치</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                </p>

                <div className="ml-6">
                  <ul className="list-decimal list-inside space-y-2 text-base text-muted-foreground">
                    <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                    <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                    <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                  </ul>
                </div>
              </section>

              {/* Section 9 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">9. 개인정보 보호책임자</h2>
                <p className="text-base leading-relaxed mb-4">
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 ml-6">
                  <h3 className="text-lg font-semibold mb-4">개인정보 보호책임자</h3>
                  <div className="space-y-2 text-base">
                    <p><span className="font-medium">이름:</span> 오늘마트 관리자</p>
                    <p><span className="font-medium">이메일:</span> help.todaymart@gmail.com</p>
                  </div>
                </div>

                <p className="text-base leading-relaxed mt-4 text-muted-foreground">
                  정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체없이 답변 및 처리해드릴 것입니다.
                </p>
              </section>

              {/* Section 10 */}
              <section className="mt-12 pb-12">
                <h2 className="text-2xl font-bold mb-6">10. 개인정보 처리방침 변경</h2>
                <p className="text-base leading-relaxed mb-4">
                  이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 ml-6 mt-6">
                  <p className="text-base"><span className="font-semibold">공고일자:</span> 2025년 1월 1일</p>
                  <p className="text-base"><span className="font-semibold">시행일자:</span> 2025년 1월 1일</p>
                </div>
              </section>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
